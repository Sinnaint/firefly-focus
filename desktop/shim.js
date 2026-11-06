/*
 * chrome.* adapter for the Windows program — the counterpart of app/shim.js.
 *
 * It runs the extension's own service_worker.js, sidepanel.js, fullscreen.js
 * and offscreen.js unchanged. Unlike the app, where every window carries a copy
 * of the timer and one of them is elected to run it, there is exactly one
 * engine here, in a hidden window that is always open. Every other window only
 * asks it for things, through main.js.
 */
(() => {
  const host = window.fireflyHost;
  const isEngine = location.pathname === "/desktop/engine.html";

  /* ---------- storage: kept by main.js, the same for every window ---------- */
  const changeListeners = [];

  host.onStorageChanged((changes) => {
    for (const fn of changeListeners.slice()) {
      try {
        fn(changes, "local");
      } catch (error) {
        console.error(error);
      }
    }
  });

  /* ---------- messages ---------- */
  /*
   * Inside the engine's page the timer and the audio code share one window, so
   * a message addressed to "offscreen" has to be routed to the audio code by
   * hand. engine.js tags each listener with the script that registered it.
   */
  const listeners = [];
  let currentContext = "engine";

  function dispatch(message) {
    const target = message?.target || "engine";
    return new Promise((resolve) => {
      let answerComing = false;
      for (const entry of listeners) {
        if (entry.context !== target) continue;
        try {
          if (entry.fn(message, {}, resolve) === true) answerComing = true;
        } catch (error) {
          console.error(error);
        }
      }
      if (!answerComing) resolve(undefined);
    });
  }

  if (isEngine) {
    host.onEngineRequest(async (id, message) => host.engineReply(id, await dispatch(message)));
  }

  /* ---------- alarms: only the engine sets them ---------- */
  const alarms = new Map();
  const alarmListeners = [];

  function fireAlarm(name) {
    const alarm = alarms.get(name);
    if (!alarm) return;
    clearTimeout(alarm.timer);
    alarms.delete(name);
    for (const fn of alarmListeners.slice()) {
      try {
        fn({ name, scheduledTime: alarm.when });
      } catch (error) {
        console.error(error);
      }
    }
  }

  // A timer does not count the time the computer spends asleep. This catches
  // what came due meanwhile, soon after it wakes.
  if (isEngine) {
    setInterval(() => {
      const now = Date.now();
      for (const [name, alarm] of [...alarms]) {
        if (alarm.when <= now) fireAlarm(name);
      }
    }, 15000);
  }

  window.chrome = {
    runtime: {
      // floating_widget.js takes this going missing to mean the extension was
      // switched off, and removes itself. The program does not go anywhere.
      id: "firefly-desktop",
      getURL: (page) => `/${page}`,
      // The widget asks with a callback, as a content script does; the rest with a promise.
      sendMessage(message, callback) {
        const answer = isEngine ? dispatch(message) : host.sendMessage(message);
        if (!callback) return answer;
        answer.then(callback);
      },
      onMessage: {
        addListener(fn) {
          listeners.push({ fn, context: currentContext });
        },
      },
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      // ensureOffscreenDocument() asks whether the audio document already
      // exists. It always does: it is the engine's own page.
      getContexts: async () => [{}],
    },

    storage: {
      local: {
        get: (query) => host.storageGet(query ?? null),
        set: (items) => host.storageSet(items),
        remove: (keys) => host.storageRemove(keys),
      },
      onChanged: {
        addListener(fn) {
          changeListeners.push(fn);
        },
        removeListener(fn) {
          const index = changeListeners.indexOf(fn);
          if (index >= 0) changeListeners.splice(index, 1);
        },
      },
    },

    alarms: {
      async create(name, { when }) {
        clearTimeout(alarms.get(name)?.timer);
        alarms.set(name, { when, timer: setTimeout(() => fireAlarm(name), Math.max(0, when - Date.now())) });
      },
      async clear(name) {
        clearTimeout(alarms.get(name)?.timer);
        alarms.delete(name);
        return true;
      },
      onAlarm: {
        addListener(fn) {
          alarmListeners.push(fn);
        },
      },
    },

    notifications: {
      async create({ title, message }) {
        host.notify({ title, message });
      },
    },

    action: {
      async setBadgeText({ text }) {
        host.setBadge(text);
      },
      async setBadgeBackgroundColor() {},
    },

    // The audio code already lives in the engine's page: creating and closing
    // its document is a no-op that keeps service_worker.js on its normal path.
    offscreen: {
      async createDocument() {},
      async closeDocument() {},
    },

    tabs: {
      async create() {
        // The one thing any page opens: the fullscreen timer.
        host.openFullscreen();
      },
    },
  };

  window.__fireflyShim = {
    setContext(name) {
      currentContext = name;
    },
    ready: () => host.engineReady(),
  };
})();
