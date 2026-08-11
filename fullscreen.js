/*
 * Fullscreen mode. Same contract as the side panel and the floating widget:
 * never counts the timer itself, just draws `endsAt - Date.now()` and asks the
 * service worker to change anything. i18n and FIREFLY_PALETTE come from
 * shared.js.
 */

let state = null;
let fireflyRecycleTimer = null;
let fireflyConfigKey = "";
let idleTimer = null;

const $ = (id) => document.getElementById(id);

const els = {
  fireflyLayer: $("fireflyLayer"),
  ring: $("ring"),
  timer: $("timer"),
  mode: $("mode"),
  task: $("task"),
  startBtn: $("startBtn"),
  pauseBtn: $("pauseBtn"),
  nextBtn: $("nextBtn"),
  sessions: $("sessions"),
  sessionsLabel: $("sessionsLabel"),
  focus: $("focus"),
  focusLabel: $("focusLabel"),
  fsBtn: $("fsBtn"),
  closeBtn: $("closeBtn"),
  settingsBtn: $("settingsBtn"),
  settingsOverlay: $("settingsOverlay"),
  settingsSheet: $("settingsSheet"),
  settingsClose: $("settingsClose"),
  settingsMount: $("settingsMount"),
  openPanelBtn: $("openPanelBtn"),
  taskCard: $("taskCard"),
  taskCardDrag: $("taskCardDrag"),
  taskCardTitle: $("taskCardTitle"),
  taskCardDragLabel: $("taskCardDragLabel"),
  taskCardList: $("taskCardList")
};

const TASKS_POSITION_KEY = "fullscreenTasksPosition";

let settingsReady = false;
let cardSignature = null;
let sheetSignature = null;
let cardPosition = null;
let drag = null;

function getLanguage() {
  const lang = state?.settings?.language;
  return i18n[lang] ? lang : "uk";
}

function t() {
  return i18n[getLanguage()];
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function getDurationMs(mode, settings) {
  if (mode === "work") return settings.workMinutes * 60 * 1000;
  if (mode === "longBreak") return settings.longBreakMinutes * 60 * 1000;
  return settings.shortBreakMinutes * 60 * 1000;
}

function getRemainingMs() {
  if (!state) return 0;
  const duration = getDurationMs(state.mode, state.settings);
  if (state.running) return Math.max(0, state.endsAt - Date.now());
  return state.remainingMs ?? duration;
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/* ---------- Fireflies ---------- */
function clampNum(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function getFireflyIntervalMs() {
  const unit = state?.settings?.fireflyIntervalUnit || "seconds";
  const value = clampNum(
    state?.settings?.fireflyIntervalValue ?? state?.settings?.fireflyIntervalMinutes ?? 10,
    unit === "seconds" ? 3 : 1,
    unit === "seconds" ? 300 : 60,
    unit === "seconds" ? 10 : 5
  );
  return unit === "minutes" ? value * 60 * 1000 : value * 1000;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

function getFireflyColors() {
  const theme = FIREFLY_PALETTE[state?.settings?.theme] || FIREFLY_PALETTE.midnight;
  return theme[state?.mode] || theme.work;
}

function applyFireflyParams(firefly) {
  const rnd = (min, max) => min + Math.random() * (max - min);
  // Roomier drift and bigger bodies than the panel — this is a whole screen.
  const waypoint = () => `${rnd(-140, 140).toFixed(1)}px`;

  firefly.style.setProperty("--fx", `${rnd(2, 98).toFixed(2)}%`);
  firefly.style.setProperty("--fy", `${rnd(2, 98).toFixed(2)}%`);
  firefly.style.setProperty("--size", `${rnd(4, 9).toFixed(1)}px`);

  for (const axis of ["x", "y"]) {
    for (let i = 1; i <= 4; i += 1) {
      firefly.style.setProperty(`--${axis}${i}`, waypoint());
    }
  }

  firefly.style.setProperty("--drift-dur", `${rnd(16, 34).toFixed(1)}s`);
  firefly.style.setProperty("--drift-delay", `${(-rnd(0, 30)).toFixed(1)}s`);
  firefly.style.setProperty("--glow-dur", `${rnd(2.8, 5.6).toFixed(1)}s`);
  firefly.style.setProperty("--glow-delay", `${(-rnd(0, 6)).toFixed(1)}s`);
}

function startFireflies() {
  const layer = els.fireflyLayer;
  if (!layer) return;

  const colors = getFireflyColors();
  layer.style.setProperty("--firefly-core", colors.core);
  layer.style.setProperty("--firefly-halo", colors.halo);
  layer.style.setProperty("--firefly-glow", colors.glow);
  layer.classList.toggle("is-active", Boolean(state?.running));

  const desired = state?.running ? 46 : 30;

  while (layer.childElementCount > desired) {
    layer.lastElementChild.remove();
  }

  if (layer.childElementCount < desired) {
    const fragment = document.createDocumentFragment();
    for (let i = layer.childElementCount; i < desired; i += 1) {
      const firefly = document.createElement("span");
      firefly.className = "firefly";
      applyFireflyParams(firefly);
      fragment.appendChild(firefly);
    }
    layer.appendChild(fragment);
  }
}

function stopFireflies() {
  els.fireflyLayer.replaceChildren();
  els.fireflyLayer.classList.remove("is-active");
}

function recycleOneFirefly() {
  const layer = els.fireflyLayer;
  if (!layer || layer.childElementCount === 0) return;
  const firefly = layer.children[Math.floor(Math.random() * layer.childElementCount)];
  if (firefly) applyFireflyParams(firefly);
}

function syncFireflyTimer(force = false) {
  const enabled =
    state?.settings?.fireflyAnimationEnabled !== false &&
    !document.hidden &&
    !prefersReducedMotion();

  const intervalMs = getFireflyIntervalMs();
  const key = `${enabled}:${intervalMs}:${state?.mode}:${state?.settings?.theme}:${state?.running ? "run" : "idle"}`;

  if (!force && key === fireflyConfigKey) return;
  fireflyConfigKey = key;

  if (fireflyRecycleTimer) {
    clearInterval(fireflyRecycleTimer);
    fireflyRecycleTimer = null;
  }

  if (!enabled) {
    stopFireflies();
    return;
  }

  startFireflies();

  fireflyRecycleTimer = setInterval(() => {
    if (document.hidden) return;
    recycleOneFirefly();
  }, Math.max(1200, intervalMs));
}

/* ---------- Ambient idle ---------- */
function isSettingsOpen() {
  return !els.settingsOverlay.hidden;
}

function markActive() {
  document.body.classList.remove("is-idle");
  clearTimeout(idleTimer);
  // Reading the settings without touching the mouse must not blank the screen.
  if (isSettingsOpen()) return;
  idleTimer = setTimeout(() => {
    document.body.classList.add("is-idle");
  }, 4000);
}

/* ---------- Settings sheet ---------- */
async function buildSettingsSheet() {
  if (settingsReady) return;

  // Clone the real form out of sidepanel.html rather than keeping a second
  // copy here: a setting added to the panel shows up in this sheet for free.
  const markup = await (await fetch(chrome.runtime.getURL("sidepanel.html"))).text();
  const parsed = new DOMParser().parseFromString(markup, "text/html");

  const selects = parsed.querySelector(".top-selects");
  const tasks = parsed.querySelector(".tasks-card");
  const card = parsed.querySelector(".settings-card");
  if (!card) throw new Error("settings markup not found in sidepanel.html");

  els.settingsMount.replaceChildren();
  if (selects) els.settingsMount.appendChild(document.importNode(selects, true));
  if (tasks) els.settingsMount.appendChild(document.importNode(tasks, true));
  els.settingsMount.appendChild(document.importNode(card, true));

  bindSettingsSheet();
  bindSheetTasks();
  settingsReady = true;
}

/* Task editing inside the sheet — same messages the panel sends. */
function bindSheetTasks() {
  const mount = els.settingsMount;
  const form = mount.querySelector("#taskForm");
  const input = mount.querySelector("#taskInput");
  const list = mount.querySelector("#tasksList");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const response = await send("ADD_TASK", { text });
    if (response?.ok) state = response.state;
    input.value = "";
    renderTaskSurfaces(true);
  });

  mount.querySelector("#clearDoneBtn")?.addEventListener("click", async () => {
    const response = await send("CLEAR_DONE_TASKS");
    if (response?.ok) state = response.state;
    renderTaskSurfaces(true);
  });

  list?.addEventListener("click", async (event) => {
    const li = event.target.closest(".task");
    if (!li?.dataset.id) return;

    if (event.target.matches("input[type='checkbox']")) {
      const response = await send("TOGGLE_TASK", { id: li.dataset.id });
      if (response?.ok) state = response.state;
      renderTaskSurfaces(true);
    }

    if (event.target.matches("button")) {
      const response = await send("DELETE_TASK", { id: li.dataset.id });
      if (response?.ok) state = response.state;
      renderTaskSurfaces(true);
    }
  });

  list?.addEventListener("change", async (event) => {
    const li = event.target.closest(".task");
    if (!li?.dataset.id || !event.target.matches("input[type='date']")) return;
    const response = await send("SET_TASK_DEADLINE", {
      id: li.dataset.id,
      deadline: event.target.value || null
    });
    if (response?.ok) state = response.state;
    renderTaskSurfaces(true);
  });
}

/* ---------- Floating task card ---------- */
function renderTaskSurfaces(force = false) {
  if (!state) return;

  const dictionary = t();
  const lang = getLanguage();
  const tasks = state.tasks || [];

  // The card lists only what is still open — it is a glance surface.
  const open = tasks.filter((task) => !task.done);
  const cardKey = tasksSignature(open, lang, "card");
  if (force || cardKey !== cardSignature) {
    cardSignature = cardKey;
    renderTasksInto(els.taskCardList, open, dictionary, {
      simple: true,
      emptyText: dictionary.noTaskYet
    });
  }

  if (settingsReady) {
    const list = els.settingsMount.querySelector("#tasksList");
    const sheetKey = tasksSignature(tasks, lang, "sheet");
    if (list && (force || sheetKey !== sheetSignature)) {
      sheetSignature = sheetKey;
      renderTasksInto(list, tasks, dictionary);
    }
  }
}

function clampCardPosition() {
  const card = els.taskCard;
  if (card.hidden) return;

  const rect = card.getBoundingClientRect();
  const pad = 12;
  const maxX = Math.max(pad, window.innerWidth - rect.width - pad);
  const maxY = Math.max(pad, window.innerHeight - rect.height - pad);

  if (!cardPosition) cardPosition = { x: maxX, y: pad };

  cardPosition.x = Math.min(Math.max(pad, cardPosition.x), maxX);
  cardPosition.y = Math.min(Math.max(pad, cardPosition.y), maxY);

  card.style.left = `${Math.round(cardPosition.x)}px`;
  card.style.top = `${Math.round(cardPosition.y)}px`;
}

async function saveCardPosition() {
  if (!cardPosition) return;
  try {
    await chrome.storage.local.set({ [TASKS_POSITION_KEY]: cardPosition });
  } catch (error) {
    // Storage can be unavailable while the extension reloads.
  }
}

async function loadCardPosition() {
  try {
    const data = await chrome.storage.local.get(TASKS_POSITION_KEY);
    cardPosition = data[TASKS_POSITION_KEY] || null;
  } catch (error) {
    cardPosition = null;
  }
}

function bindSettingsSheet() {
  const mount = els.settingsMount;
  const q = (id) => mount.querySelector(`#${id}`);

  q("saveBtn")?.addEventListener("click", async () => {
    const response = await send("SAVE_SETTINGS", {
      settings: collectSettingsFrom(mount, state?.settings || {})
    });
    if (response?.ok) state = response.state;
    applySettingsTo(mount, state.settings);
    render();
    closeSettings();
  });

  q("resetStatsBtn")?.addEventListener("click", async () => {
    const response = await send("RESET_STATS");
    if (response?.ok) state = response.state;
    render();
  });

  // Theme and language apply live, exactly as they do in the panel.
  for (const id of ["themeSelect", "languageSelect"]) {
    q(id)?.addEventListener("change", async () => {
      const settings = collectSettingsFrom(mount, state?.settings || {});
      state = { ...state, settings };
      render();
      applyI18nIn(mount, t());
      const response = await send("SAVE_SETTINGS", { settings });
      if (response?.ok) state = response.state;
      render();
    });
  }

  q("fireflyIntervalUnit")?.addEventListener("change", () => syncFireflyIntervalBounds(mount));

  bindPresetPicker(mount);

  q("textScale")?.addEventListener("input", (event) => {
    const scale = clampNum(Number(event.target.value), 80, 140, 100) / 100;
    document.documentElement.style.setProperty("--text-scale", String(scale));
  });
}

async function openSettings() {
  try {
    await buildSettingsSheet();
  } catch (error) {
    console.error(error);
    return;
  }

  applySettingsTo(els.settingsMount, state.settings);
  applyI18nIn(els.settingsMount, t());
  els.settingsOverlay.hidden = false;
  document.body.classList.add("is-settings-open");
  markActive();
  els.settingsClose.focus();
}

function closeSettings() {
  els.settingsOverlay.hidden = true;
  document.body.classList.remove("is-settings-open");
  markActive();
}

/* ---------- Render ---------- */
function render() {
  if (!state) return;

  const dictionary = t();
  const duration = getDurationMs(state.mode, state.settings);
  const remaining = getRemainingMs();
  const progress = Math.min(100, Math.max(0, 100 - (remaining / duration) * 100));

  document.documentElement.lang = getLanguage();
  document.body.dataset.mode = state.mode;
  document.body.dataset.theme = state.settings.theme || "midnight";
  document.documentElement.style.setProperty(
    "--text-scale",
    String((state.settings.textScale ?? 100) / 100)
  );
  els.ring.style.setProperty("--progress", `${progress * 3.6}deg`);

  els.timer.textContent = formatTime(remaining);
  els.mode.textContent = dictionary.modes[state.mode];

  // The first unfinished task, so a glance at the monitor says what to do.
  const current = (state.tasks || []).find((task) => !task.done);
  els.task.textContent = current ? current.text : "";

  els.startBtn.textContent = dictionary.start;
  els.pauseBtn.textContent = dictionary.pause;
  els.nextBtn.textContent = dictionary.nextStage;
  els.startBtn.disabled = state.running;
  els.pauseBtn.disabled = !state.running;

  els.sessions.textContent = `${state.stats.sessionsToday}/${state.settings.dailyGoalSessions}`;
  els.sessionsLabel.textContent = dictionary.sessionsToday;
  els.focus.textContent = `${Math.round(state.stats.focusMsToday / 60000)} ${dictionary.minShort}`;
  els.focusLabel.textContent = dictionary.focusToday;

  const isFull = Boolean(document.fullscreenElement);
  els.fsBtn.title = isFull ? dictionary.exitFullscreen : dictionary.enterFullscreen;
  els.fsBtn.setAttribute("aria-label", els.fsBtn.title);
  els.closeBtn.title = dictionary.close;
  els.closeBtn.setAttribute("aria-label", dictionary.close);
  els.settingsBtn.title = dictionary.settingsTitle;
  els.settingsBtn.setAttribute("aria-label", dictionary.settingsTitle);
  els.settingsClose.title = dictionary.close;
  els.settingsClose.setAttribute("aria-label", dictionary.close);
  els.openPanelBtn.textContent = dictionary.openPanel;

  els.taskCard.hidden = state.settings.fullscreenTasksEnabled === false;
  els.taskCardTitle.textContent = dictionary.tasksTitle;
  els.taskCardDragLabel.textContent = dictionary.tasksDrag;
  renderTaskSurfaces();
  clampCardPosition();

  syncFireflyTimer();
}

/* ---------- Events ---------- */
els.startBtn.addEventListener("click", async () => {
  const response = await send("START");
  if (response?.ok) state = response.state;
  render();
});

els.pauseBtn.addEventListener("click", async () => {
  const response = await send("PAUSE");
  if (response?.ok) state = response.state;
  render();
});

els.nextBtn.addEventListener("click", async () => {
  const response = await send("SKIP_STAGE");
  if (response?.ok) state = response.state;
  render();
});

els.fsBtn.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    // Denied (no gesture, or blocked by policy) — the page still fills the tab.
  }
});

els.closeBtn.addEventListener("click", () => {
  window.close();
});

els.settingsBtn.addEventListener("click", openSettings);
els.settingsClose.addEventListener("click", closeSettings);

els.settingsOverlay.addEventListener("click", (event) => {
  if (event.target === els.settingsOverlay) closeSettings();
});

els.openPanelBtn.addEventListener("click", async () => {
  // The side panel cannot draw over a fullscreened tab — step out first.
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      // Ignore; opening the panel is still worth attempting.
    }
  }
  await send("OPEN_SIDE_PANEL");
  closeSettings();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isSettingsOpen()) closeSettings();
});

/* Ticking a task straight off the floating card. */
els.taskCardList.addEventListener("click", async (event) => {
  const checkbox = event.target.closest("input[type='checkbox']");
  if (!checkbox) return;
  const li = checkbox.closest(".task");
  if (!li?.dataset.id) return;

  const response = await send("TOGGLE_TASK", { id: li.dataset.id });
  if (response?.ok) state = response.state;
  renderTaskSurfaces(true);
  render();
});

/* ---------- Dragging the task card ---------- */
els.taskCardDrag.addEventListener("pointerdown", (event) => {
  const rect = els.taskCard.getBoundingClientRect();
  drag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  els.taskCardDrag.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});

window.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  cardPosition = { x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY };
  clampCardPosition();
  markActive();
  event.preventDefault();
}, { passive: false });

window.addEventListener("pointerup", async (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  els.taskCardDrag.releasePointerCapture?.(event.pointerId);
  drag = null;
  await saveCardPosition();
});

window.addEventListener("resize", () => {
  clampCardPosition();
  saveCardPosition();
});

document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
  render();
});

for (const event of ["pointermove", "pointerdown", "keydown", "wheel"]) {
  window.addEventListener(event, markActive, { passive: true });
}

document.addEventListener("visibilitychange", () => syncFireflyTimer(true));

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.pomodoro?.newValue) {
    state = changes.pomodoro.newValue;
    render();
  }
});

async function loadState() {
  await loadCardPosition();
  const response = await send("GET_STATE");
  if (!response?.ok) throw new Error(response?.error || "Could not load timer state");
  state = response.state;
  render();
}

loadState().catch((error) => {
  console.error(error);
  els.mode.textContent = error.message;
});

markActive();
setInterval(render, 500);
