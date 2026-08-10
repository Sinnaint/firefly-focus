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
  closeBtn: $("closeBtn")
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
function markActive() {
  document.body.classList.remove("is-idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    document.body.classList.add("is-idle");
  }, 4000);
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
