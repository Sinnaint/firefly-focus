/*
 * chrome.* adapter for the standalone app.
 *
 * The app is not a rewrite. It runs the extension's own service_worker.js,
 * sidepanel.js, fullscreen.js and offscreen.js unchanged, on top of this
 * adapter — everything those files ask the browser for has a plain-web
 * equivalent, and this is the one place that mapping lives. Keeping it that
 * way is the point: a fix to the timer or the task list lands in both targets
 * at once, because there is only one copy of them.
 *
 * Inside the extension this file does nothing at all (chrome.runtime.id only
 * ever exists there), so it is safe to load anywhere.
 */
(() => {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) return;

  const PREFIX = "firefly:";
  const CHANNEL = "firefly-focus";
  const ENGINE_LOCK = "firefly-engine";

  /*
   * Listeners are tagged with the script that registered them, so a message
   * addressed to "offscreen" reaches the audio code and not the timer engine.
   * In the extension those live in separate contexts and the browser does the
   * routing; here they share one page, so the routing has to be explicit.
   */
  const listeners = [];
  const changeListeners = [];
  const alarmListeners = [];
  const alarms = new Map();
  const channel = "BroadcastChannel" in self ? new BroadcastChannel(CHANNEL) : null;

  let currentContext = "engine";
  let isLeader = false;

  /* ---------- storage ---------- */
  function readKey(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? undefined : JSON.parse(raw);
    } catch (error) {
      return undefined;
    }
  }

  function fireChange(changes) {
    for (const fn of changeListeners.slice()) {
      try {
        fn(changes, "local");
      } catch (error) {
        console.error(error);
      }
    }
  }

  const storageLocal = {
    async get(query) {
      const out = {};

      if (query === undefined || query === null) {
        for (let i = 0; i < localStorage.length; i += 1) {
          const full = localStorage.key(i);
          if (full && full.startsWith(PREFIX)) {
            const key = full.slice(PREFIX.length);
            out[key] = readKey(key);
          }
        }
        return out;
      }

      const keys = typeof query === "string" ? [query] : Array.isArray(query) ? query : Object.keys(query);
      const defaults = typeof query === "object" && !Array.isArray(query) ? query : {};

      for (const key of keys) {
        const value = readKey(key);
        out[key] = value === undefined ? defaults[key] : value;
      }
      return out;
    },

    async set(items) {
      const changes = {};

      for (const [key, value] of Object.entries(items)) {
        const oldValue = readKey(key);
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (error) {
          console.error("Storage is full or unavailable:", error);
          continue;
        }
        changes[key] = { oldValue, newValue: value };
      }

      if (!Object.keys(changes).length) return;

      fireChange(changes);
      channel?.postMessage({ kind: "storage", changes });
    },

    async remove(key) {
      const keys = typeof key === "string" ? [key] : key;
      const changes = {};
      for (const k of keys) {
        changes[k] = { oldValue: readKey(k), newValue: undefined };
        localStorage.removeItem(PREFIX + k);
      }
      fireChange(changes);
      channel?.postMessage({ kind: "storage", changes });
    }
  };

  /* ---------- messaging ---------- */
  function dispatch(message) {
    const target = message?.target || "engine";
    const matching = listeners.filter((entry) => entry.context === target);

    for (const entry of matching) {
      let settled = false;
      let responded;
      const respond = (value) => {
        settled = true;
        responded = value;
        entry.resolve?.(value);
      };

      let keepAlive = false;
      const pending = new Promise((resolve) => {
        entry.resolve = resolve;
      });

      try {
        keepAlive = entry.fn(message, {}, respond) === true;
      } catch (error) {
        console.error(error);
      }

      if (settled) return Promise.resolve(responded);
      if (keepAlive) return pending;
    }

    return Promise.resolve(undefined);
  }

  /* ---------- alarms ---------- */
  function armAlarm(name) {
    const alarm = alarms.get(name);
    if (!alarm || !isLeader) return;

    clearTimeout(alarm.timer);
    alarm.timer = setTimeout(() => fireAlarm(name), Math.max(0, alarm.when - Date.now()));
  }

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

  /*
   * chrome.alarms fires on time whatever the browser is doing; setTimeout in a
   * hidden window does not — Chrome throttles background timers to about once
   * a minute, so a stage could end late. Sweeping for overdue alarms, and
   * doing it immediately when the window comes back, keeps the overshoot to
   * the throttle interval instead of letting it run on unbounded.
   */
  function sweepOverdueAlarms() {
    if (!isLeader) return;
    const now = Date.now();
    for (const [name, alarm] of [...alarms]) {
      if (alarm.when <= now) fireAlarm(name);
    }
  }

  setInterval(sweepOverdueAlarms, 15000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sweepOverdueAlarms();
  });

  /*
   * Only one window may own the timer, or a second tab would fire the same
   * stage-end twice: two sounds, two notifications. The Web Locks API hands
   * the lock straight to the next window when this one closes, so ownership
   * survives the leader being shut.
   */
  async function claimLeadership() {
    if (!navigator.locks?.request) {
      isLeader = true;
      return;
    }

    navigator.locks
      .request(ENGINE_LOCK, () => {
        isLeader = true;
        for (const name of alarms.keys()) armAlarm(name);
        return new Promise(() => {});
      })
      .catch(() => {
        isLeader = true;
      });
  }

  /* ---------- notifications and badge ---------- */
  async function showNotification(options) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        return;
      }
    }

    if (Notification.permission !== "granted") return;

    try {
      new Notification(options.title, {
        body: options.message,
        icon: options.iconUrl,
        tag: "firefly-focus"
      });
    } catch (error) {
      // Some platforms only allow notifications through a service worker.
    }
  }

  const baseTitle = document.title;

  function setBadge(text) {
    document.title = text ? `${text} · ${baseTitle}` : baseTitle;

    // An installed app can carry a real dot on its taskbar icon.
    if (!navigator.setAppBadge) return;
    if (text) navigator.setAppBadge().catch(() => {});
    else navigator.clearAppBadge?.().catch(() => {});
  }

  /* ---------- the shim itself ---------- */
  const shim = {
    runtime: {
      // Deliberately no `id`: content-script code guards on it, and this
      // adapter is not an extension.
      getURL: (path) => path,

      sendMessage(message) {
        // The ambient view asks for the full panel; here that is a page.
        if (message?.type === "OPEN_SIDE_PANEL") {
          window.location.assign("index.html");
        }
        return dispatch(message);
      },

      onMessage: {
        addListener(fn) {
          listeners.push({ fn, context: currentContext });
        }
      },

      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },

      // ensureOffscreenDocument() asks whether the audio document already
      // exists. In one page it always does — this page is it.
      getContexts: async () => [{}]
    },

    storage: {
      local: storageLocal,
      onChanged: {
        addListener(fn) {
          changeListeners.push(fn);
        }
      }
    },

    alarms: {
      async create(name, info) {
        alarms.set(name, { when: info.when, timer: null });
        armAlarm(name);
      },
      async clear(name) {
        const alarm = alarms.get(name);
        if (alarm) clearTimeout(alarm.timer);
        alarms.delete(name);
        return true;
      },
      onAlarm: {
        addListener(fn) {
          alarmListeners.push(fn);
        }
      }
    },

    notifications: {
      async create(options) {
        if (isLeader) await showNotification(options);
      }
    },

    action: {
      async setBadgeText({ text }) {
        setBadge(text);
      },
      async setBadgeBackgroundColor() {}
    },

    // No offscreen documents outside an extension: the audio code runs in
    // this page, so creating and closing one is a no-op that keeps
    // service_worker.js on its normal path.
    offscreen: {
      async createDocument() {},
      async closeDocument() {}
    },

    tabs: {
      async create({ url }) {
        window.open(url === "fullscreen.html" ? "ambient.html" : url, "_blank");
      }
    }
  };

  /*
   * offscreen.js builds a fresh AudioContext for every signal. An offscreen
   * document is allowed to do that at any moment; an ordinary page is not —
   * a context created minutes after the last click starts suspended and the
   * signal is silently swallowed. Resuming on construction costs nothing when
   * the context is already running.
   */
  if (window.AudioContext) {
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) {
        super(...args);
        if (this.state === "suspended") this.resume().catch(() => {});
      }
    };
  }

  channel?.addEventListener("message", (event) => {
    if (event.data?.kind === "storage") fireChange(event.data.changes);
  });

  window.chrome = shim;

  /*
   * The boot script sets this before loading each extension file, so messages
   * addressed to "offscreen" reach the audio code rather than the engine.
   */
  window.__fireflyShim = {
    setContext(name) {
      currentContext = name;
    },
    isLeader: () => isLeader
  };

  claimLeadership();
})();
