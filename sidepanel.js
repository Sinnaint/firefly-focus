let state = null;
let fireflyRecycleTimer = null;
let fireflyConfigKey = "";
let lastTasksSignature = null;

const $ = (id) => document.getElementById(id);

const els = {
  app: $("app"),
  fireflyLayer: $("fireflyLayer"),
  ring: $("ring"),
  timerShell: $("timerShell"),
  timer: $("timer"),
  mode: $("mode"),
  modeChip: $("modeChip"),
  hint: $("hint"),
  subtitle: $("subtitle"),

  languageSelect: $("languageSelect"),
  viewToggleBtn: $("viewToggleBtn"),
  fullscreenBtn: $("fullscreenBtn"),

  startBtn: $("startBtn"),
  pauseBtn: $("pauseBtn"),
  nextBtn: $("nextBtn"),
  resetBtn: $("resetBtn"),
  floatingToggleBtn: $("floatingToggleBtn"),
  floatingToggleState: $("floatingToggleState"),

  todaySessions: $("todaySessions"),
  todayFocus: $("todayFocus"),
  goalText: $("goalText"),

  taskForm: $("taskForm"),
  taskInput: $("taskInput"),
  tasksList: $("tasksList"),
  clearDoneBtn: $("clearDoneBtn"),

  workMinutes: $("workMinutes"),
  shortBreakMinutes: $("shortBreakMinutes"),
  longBreakMinutes: $("longBreakMinutes"),
  cyclesBeforeLong: $("cyclesBeforeLong"),
  remindBeforeEndSeconds: $("remindBeforeEndSeconds"),
  dailyGoalSessions: $("dailyGoalSessions"),
  textScale: $("textScale"),
  soundTheme: $("soundTheme"),
  themeSelect: $("themeSelect"),
  fireflyIntervalValue: $("fireflyIntervalValue"),
  fireflyIntervalUnit: $("fireflyIntervalUnit"),
  autoContinue: $("autoContinue"),
  notificationsEnabled: $("notificationsEnabled"),
  soundEnabled: $("soundEnabled"),
  floatingWidgetEnabled: $("floatingWidgetEnabled"),
  fireflyAnimationEnabled: $("fireflyAnimationEnabled"),
  saveBtn: $("saveBtn"),
  resetStatsBtn: $("resetStatsBtn")
};

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

  if (state.running) {
    return Math.max(0, state.endsAt - Date.now());
  }

  return state.remainingMs ?? duration;
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatMinutes(ms) {
  return `${Math.round(ms / 60000)} ${t().minShort}`;
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
  const waypoint = () => `${rnd(-60, 60).toFixed(1)}px`;

  firefly.style.setProperty("--fx", `${rnd(4, 96).toFixed(2)}%`);
  firefly.style.setProperty("--fy", `${rnd(4, 96).toFixed(2)}%`);
  firefly.style.setProperty("--size", `${rnd(3, 6).toFixed(1)}px`);

  firefly.style.setProperty("--x1", waypoint());
  firefly.style.setProperty("--y1", waypoint());
  firefly.style.setProperty("--x2", waypoint());
  firefly.style.setProperty("--y2", waypoint());
  firefly.style.setProperty("--x3", waypoint());
  firefly.style.setProperty("--y3", waypoint());
  firefly.style.setProperty("--x4", waypoint());
  firefly.style.setProperty("--y4", waypoint());

  firefly.style.setProperty("--drift-dur", `${rnd(11, 24).toFixed(1)}s`);
  firefly.style.setProperty("--drift-delay", `${(-rnd(0, 22)).toFixed(1)}s`);
  firefly.style.setProperty("--glow-dur", `${rnd(2.6, 5).toFixed(1)}s`);
  firefly.style.setProperty("--glow-delay", `${(-rnd(0, 5)).toFixed(1)}s`);
}

function startFireflies() {
  const layer = els.fireflyLayer;
  if (!layer) return;

  const colors = getFireflyColors();
  layer.style.setProperty("--firefly-core", colors.core);
  layer.style.setProperty("--firefly-halo", colors.halo);
  layer.style.setProperty("--firefly-glow", colors.glow);
  layer.classList.toggle("is-active", Boolean(state?.running));

  const desired = state?.running ? 22 : 14;

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
  if (els.fireflyLayer) {
    els.fireflyLayer.replaceChildren();
    els.fireflyLayer.classList.remove("is-active");
  }
}

function recycleOneFirefly() {
  const layer = els.fireflyLayer;
  if (!layer || layer.childElementCount === 0) return;

  const index = Math.floor(Math.random() * layer.childElementCount);
  const firefly = layer.children[index];
  if (firefly) applyFireflyParams(firefly);
}

function syncFireflyTimer(force = false) {
  if (!els.fireflyLayer) return;

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
  }, Math.max(1500, intervalMs));
}

/* Form reading/writing lives in shared.js — the fullscreen sheet hosts the
   same inputs and must stay byte-identical in how it saves them. */
function collectSettings() {
  return collectSettingsFrom(document, state?.settings || {});
}

function syncSettingsInputs() {
  if (!state) return;
  applySettingsTo(document, state.settings);
}

function applyLanguage() {
  const dictionary = t();

  document.documentElement.lang = getLanguage();
  applyI18nIn(document, dictionary);

  els.taskInput.placeholder = dictionary.taskPlaceholder;
  els.taskForm.querySelector("button").setAttribute("aria-label", dictionary.addTaskAria);
}

function renderTasks() {
  // Guarded by a fingerprint: the 500ms tick would otherwise rebuild the rows
  // constantly and slam any open native date picker shut.
  const signature = tasksSignature(state.tasks, getLanguage());
  if (signature === lastTasksSignature) return;
  lastTasksSignature = signature;

  renderTasksInto(els.tasksList, state.tasks || [], t());
}

function render() {
  if (!state) return;

  const dictionary = t();
  const viewMode = state.settings.widgetMode === "compact" ? "compact" : "full";
  const duration = getDurationMs(state.mode, state.settings);
  const remaining = getRemainingMs();
  const progress = Math.min(100, Math.max(0, 100 - (remaining / duration) * 100));

  document.body.dataset.mode = state.mode;
  document.body.dataset.view = viewMode;
  document.body.dataset.theme = state.settings.theme || "midnight";
  document.body.dataset.face = state.settings.timerFace || "ring";
  document.body.dataset.running = String(Boolean(state.running));
  document.documentElement.style.setProperty("--text-scale", String((state.settings.textScale ?? 100) / 100));
  els.ring.style.setProperty("--progress", `${progress * 3.6}deg`);
  // The digits face draws a linear bar, which a conic angle cannot express.
  els.ring.style.setProperty("--progress-pct", `${progress}%`);

  applyLanguage();

  els.timer.textContent = formatTime(remaining);
  els.mode.textContent = dictionary.modes[state.mode];
  els.modeChip.textContent = dictionary.modes[state.mode];

  els.hint.textContent = state.running ? dictionary.hints[state.mode] : dictionary.idleHint;
  els.subtitle.textContent = state.running ? dictionary.runningSubtitle : dictionary.idleSubtitle;

  els.viewToggleBtn.textContent = viewMode === "compact" ? dictionary.full : dictionary.compact;
  els.viewToggleBtn.title = viewMode === "compact" ? dictionary.full : dictionary.compact;
  els.fullscreenBtn.title = dictionary.fullscreenTitle;

  els.startBtn.disabled = state.running;
  els.pauseBtn.disabled = !state.running;

  const floatingOn = state.settings.floatingWidgetEnabled !== false;
  els.floatingToggleBtn.setAttribute("aria-checked", String(floatingOn));
  els.floatingToggleState.textContent = floatingOn
    ? dictionary.widgetStateOn
    : dictionary.widgetStateOff;

  els.todaySessions.textContent = state.stats.sessionsToday;
  els.todayFocus.textContent = formatMinutes(state.stats.focusMsToday);
  els.goalText.textContent = `${state.stats.sessionsToday}/${state.settings.dailyGoalSessions}`;

  renderTasks();
  syncFireflyTimer();
}

document.addEventListener("visibilitychange", () => syncFireflyTimer(true));

async function loadState() {
  const response = await send("GET_STATE");
  if (!response.ok) throw new Error(response.error || "Could not load timer state");

  state = response.state;
  syncSettingsInputs();
  render();
}

async function saveSettingsPatch(patch) {
  const settings = {
    ...collectSettings(),
    ...patch
  };

  const response = await send("SAVE_SETTINGS", { settings });
  if (!response.ok) throw new Error(response.error || "Could not save settings");

  state = response.state;
  syncSettingsInputs();
  render();
}

els.startBtn.addEventListener("click", async () => {
  const response = await send("START");
  state = response.state;
  render();
});

els.pauseBtn.addEventListener("click", async () => {
  const response = await send("PAUSE");
  state = response.state;
  render();
});

els.nextBtn.addEventListener("click", async () => {
  const response = await send("SKIP_STAGE");
  state = response.state;
  render();
});

els.resetBtn.addEventListener("click", async () => {
  const response = await send("RESET_TIMER");
  state = response.state;
  syncSettingsInputs();
  render();
});

els.floatingToggleBtn.addEventListener("click", async () => {
  if (!state) return;

  const next = state.settings.floatingWidgetEnabled === false;

  state = {
    ...state,
    settings: {
      ...state.settings,
      floatingWidgetEnabled: next
    }
  };

  render();
  await saveSettingsPatch({ floatingWidgetEnabled: next });
});

els.fullscreenBtn.addEventListener("click", () => {
  // Its own tab: the side panel cannot go fullscreen, and a tab survives the
  // panel being closed — which is the point of an ambient monitor timer.
  chrome.tabs.create({ url: chrome.runtime.getURL("fullscreen.html") });
});

els.fireflyIntervalUnit.addEventListener("change", () => {
  syncFireflyIntervalBounds(document);
});

bindPresetPicker(document);

// Live preview of text size while typing/stepping (persists on Save).
els.textScale.addEventListener("input", () => {
  const scale = clampNum(Number(els.textScale.value), 80, 140, 100) / 100;
  document.documentElement.style.setProperty("--text-scale", String(scale));
});

els.saveBtn.addEventListener("click", async () => {
  const response = await send("SAVE_SETTINGS", { settings: collectSettings() });
  state = response.state;
  syncSettingsInputs();
  render();
});

els.languageSelect.addEventListener("change", async () => {
  if (!state) return;

  state = {
    ...state,
    settings: {
      ...state.settings,
      language: els.languageSelect.value
    }
  };

  render();
  await saveSettingsPatch({ language: els.languageSelect.value });
});

els.themeSelect.addEventListener("change", async () => {
  if (!state) return;

  state = {
    ...state,
    settings: {
      ...state.settings,
      theme: els.themeSelect.value
    }
  };

  render();
  await saveSettingsPatch({ theme: els.themeSelect.value });
});

els.viewToggleBtn.addEventListener("click", async () => {
  if (!state) return;

  const nextMode = state.settings.widgetMode === "compact" ? "full" : "compact";

  state = {
    ...state,
    settings: {
      ...state.settings,
      widgetMode: nextMode
    }
  };

  render();
  await saveSettingsPatch({ widgetMode: nextMode });
});

els.app.addEventListener("click", async (event) => {
  if (!state || state.settings.widgetMode !== "compact") return;

  const interactive = event.target.closest("button, input, select, textarea, a, label");
  if (interactive) return;

  state = {
    ...state,
    settings: {
      ...state.settings,
      widgetMode: "full"
    }
  };

  render();
  await saveSettingsPatch({ widgetMode: "full" });
});

els.resetStatsBtn.addEventListener("click", async () => {
  const response = await send("RESET_STATS");
  state = response.state;
  render();
});

els.taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = els.taskInput.value.trim();
  if (!text) return;

  const response = await send("ADD_TASK", { text });
  state = response.state;
  els.taskInput.value = "";
  render();
});

els.tasksList.addEventListener("click", async (event) => {
  const li = event.target.closest(".task");
  if (!li || !li.dataset.id) return;

  if (event.target.matches("input[type='checkbox']")) {
    const response = await send("TOGGLE_TASK", { id: li.dataset.id });
    state = response.state;
    render();
  }

  if (event.target.matches("button")) {
    const response = await send("DELETE_TASK", { id: li.dataset.id });
    state = response.state;
    render();
  }
});

els.tasksList.addEventListener("change", async (event) => {
  const li = event.target.closest(".task");
  if (!li || !li.dataset.id) return;

  if (event.target.matches("input[type='date']")) {
    const response = await send("SET_TASK_DEADLINE", {
      id: li.dataset.id,
      deadline: event.target.value || null
    });
    state = response.state;
    render();
  }
});

els.clearDoneBtn.addEventListener("click", async () => {
  const response = await send("CLEAR_DONE_TASKS");
  state = response.state;
  render();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.pomodoro?.newValue) {
    state = changes.pomodoro.newValue;
    syncSettingsInputs();
    render();
  }
});

loadState().catch((error) => {
  console.error(error);
  els.hint.textContent = error.message;
});

setInterval(render, 500);
