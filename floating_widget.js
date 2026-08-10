(() => {
  if (window.__POMODORO_FLOATING_WIDGET__) return;
  window.__POMODORO_FLOATING_WIDGET__ = true;

  const POSITION_KEY = "pomodoroFloatingPosition";
  const HOST_ID = "ai-pomodoro-floating-widget-host";

  const i18n = {
    uk: {
      title: "Pomodoro",
      open: "Налаштування",
      drag: "Перетягни",
      close: "Закрити",
      closeTitle: "Сховати на цій сторінці (з'явиться знову після перезавантаження)",
      start: "Старт",
      pause: "Пауза",
      focus: "Робота",
      shortBreak: "Перерва",
      longBreak: "Довга перерва",
      tasks: "Задачі",
      noTasks: "Задач ще немає",
      openHint: "Клік по віджету відкриває повну панель"
    },
    en: {
      title: "Pomodoro",
      open: "Settings",
      drag: "Drag",
      close: "Close",
      closeTitle: "Hide on this page (comes back after reload)",
      start: "Start",
      pause: "Pause",
      focus: "Focus",
      shortBreak: "Break",
      longBreak: "Long break",
      tasks: "Tasks",
      noTasks: "No tasks yet",
      openHint: "Click the widget to open the full panel"
    },
    de: {
      title: "Pomodoro",
      open: "Einstellungen",
      drag: "Ziehen",
      close: "Schließen",
      closeTitle: "Auf dieser Seite ausblenden (erscheint nach dem Neuladen wieder)",
      start: "Start",
      pause: "Pause",
      focus: "Fokus",
      shortBreak: "Pause",
      longBreak: "Lange Pause",
      tasks: "Aufgaben",
      noTasks: "Noch keine Aufgaben",
      openHint: "Klicke das Widget an, um das volle Panel zu öffnen"
    },
    es: {
      title: "Pomodoro",
      open: "Ajustes",
      drag: "Arrastrar",
      close: "Cerrar",
      closeTitle: "Ocultar en esta página (vuelve al recargar)",
      start: "Iniciar",
      pause: "Pausa",
      focus: "Enfoque",
      shortBreak: "Descanso",
      longBreak: "Descanso largo",
      tasks: "Tareas",
      noTasks: "Aún no hay tareas",
      openHint: "Haz clic en el widget para abrir el panel completo"
    },
    it: {
      title: "Pomodoro",
      open: "Impostazioni",
      drag: "Trascina",
      close: "Chiudi",
      closeTitle: "Nascondi in questa pagina (riappare al ricaricamento)",
      start: "Avvia",
      pause: "Pausa",
      focus: "Concentrazione",
      shortBreak: "Pausa",
      longBreak: "Pausa lunga",
      tasks: "Attività",
      noTasks: "Ancora nessuna attività",
      openHint: "Clicca il widget per aprire il pannello completo"
    },
    sk: {
      title: "Pomodoro",
      open: "Nastavenia",
      drag: "Presuň",
      close: "Zavrieť",
      closeTitle: "Skryť na tejto stránke (znova sa zobrazí po obnovení)",
      start: "Štart",
      pause: "Pauza",
      focus: "Fokus",
      shortBreak: "Prestávka",
      longBreak: "Dlhá prestávka",
      tasks: "Úlohy",
      noTasks: "Zatiaľ žiadne úlohy",
      openHint: "Klikni na widget, aby si otvoril celý panel"
    },
    cs: {
      title: "Pomodoro",
      open: "Nastavení",
      drag: "Táhni",
      close: "Zavřít",
      closeTitle: "Skrýt na této stránce (znovu se zobrazí po obnovení)",
      start: "Start",
      pause: "Pauza",
      focus: "Fokus",
      shortBreak: "Přestávka",
      longBreak: "Dlouhá přestávka",
      tasks: "Úkoly",
      noTasks: "Zatím žádné úkoly",
      openHint: "Klikni na widget pro otevření celého panelu"
    }
  };

  let state = null;
  let position = null;
  let host;
  let root;
  let nodes = {};
  let drag = null;
  let movedDuringPointer = false;
  let sessionDismissed = false;
  let fireflyRecycleTimer = null;
  let fireflyConfigKey = "";

  function safeSend(type, payload = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || { ok: false });
        });
      } catch (error) {
        resolve({ ok: false, error: error.message });
      }
    });
  }

  function getLanguage() {
    const lang = state?.settings?.language;
    return i18n[lang] ? lang : "uk";
  }

  function t() {
    return i18n[getLanguage()];
  }

  function getModeLabel(mode) {
    const dictionary = t();
    if (mode === "work") return dictionary.focus;
    if (mode === "longBreak") return dictionary.longBreak;
    return dictionary.shortBreak;
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

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function getTextScale() {
    return clampNumber(state?.settings?.textScale, 80, 140, 100) / 100;
  }

  function deadlineUrgency(deadline, done) {
    if (!deadline || done) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${deadline}T00:00:00`);
    if (Number.isNaN(due.getTime())) return "";

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 2) return "soon";
    return "";
  }

  function getFireflyIntervalMs() {
    const unit = state?.settings?.fireflyIntervalUnit || "seconds";

    const value = clampNumber(
      state?.settings?.fireflyIntervalValue ?? state?.settings?.fireflyIntervalMinutes ?? 10,
      unit === "seconds" ? 3 : 1,
      unit === "seconds" ? 300 : 60,
      unit === "seconds" ? 10 : 5
    );

    return unit === "minutes"
      ? value * 60 * 1000
      : value * 1000;
  }

  function createWidget() {
    if (document.getElementById(HOST_ID)) return;

    host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("aria-live", "polite");

    root = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        z-index: 2147483647;
        left: 24px;
        top: 120px;
        width: 264px;
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        pointer-events: auto;
      }

      * {
        box-sizing: border-box;
      }

      .widget {
        /* Surface tokens — default theme: Midnight (see .widget[data-theme]).
           Palette "Moon": deep violet ground, moonlit pink ink. */
        --w-text: #f2e2ec;
        --w-title: #fdf3f8;
        --w-muted: #d5b6ca;
        --w-subtle: #ab8bb6;
        --w-border: rgba(232, 200, 240, 0.18);
        --w-border-strong: rgba(232, 200, 240, 0.30);
        --w-hairline: rgba(232, 200, 240, 0.14);
        --w-soft: rgba(228, 190, 236, 0.12);
        --w-soft-2: rgba(228, 190, 236, 0.08);
        --w-bg:
          radial-gradient(130% 90% at 0% 0%, var(--accent-bg), transparent 55%),
          radial-gradient(120% 120% at 100% 4%, rgba(102, 103, 171, 0.20), transparent 52%),
          linear-gradient(165deg, rgba(66, 13, 75, 0.94), rgba(20, 3, 32, 0.96));
        --w-ring-track: rgba(200, 170, 215, 0.18);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(58, 11, 69, 0.94), rgba(18, 3, 28, 0.97));
        --w-tasks-bg: rgba(33, 6, 53, 0.46);
        --w-task-bg: rgba(228, 190, 236, 0.08);
        --w-shadow-1: rgba(12, 2, 20, 0.78);
        --w-shadow-2: rgba(12, 2, 20, 0.62);
        --w-scroll: rgba(228, 190, 236, 0.30);
        --on-accent: #2b0630;
        --text-scale: 1;

        position: relative;
        width: 264px;
        overflow: hidden;
        border-radius: 24px;
        border: 1px solid var(--w-border);
        color: var(--w-text);
        background: var(--w-bg);
        box-shadow:
          inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
          0 24px 60px -20px var(--w-shadow-1),
          0 8px 24px -14px var(--w-shadow-2);
        opacity: 0.96;
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
        backdrop-filter: blur(20px) saturate(1.2);
        user-select: none;
        animation: pomodoroWidgetIn .5s cubic-bezier(.2, .7, .2, 1) both;
        transition: opacity .25s ease, box-shadow .25s ease, border-color .25s ease;
      }

      .widget[data-theme="daylight"] {
        color-scheme: light;
        --w-text: #3a2c46;
        --w-title: #2b1f36;
        --w-muted: #5f4f70;
        --w-subtle: #77678a;
        --w-border: rgba(90, 60, 110, 0.15);
        --w-border-strong: rgba(90, 60, 110, 0.26);
        --w-hairline: rgba(90, 60, 110, 0.12);
        --w-soft: rgba(90, 60, 110, 0.06);
        --w-soft-2: rgba(90, 60, 110, 0.04);
        --w-bg:
          radial-gradient(130% 90% at 0% 0%, var(--accent-bg), transparent 60%),
          radial-gradient(120% 120% at 100% 4%, rgba(195, 199, 243, 0.30), transparent 55%),
          linear-gradient(165deg, rgba(250, 240, 252, 0.96), rgba(243, 220, 220, 0.96));
        /* The widget ring is thin — the track needs a touch more ink than the panel's. */
        --w-ring-track: rgba(90, 60, 110, 0.18);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(255, 253, 255, 0.97), rgba(246, 236, 246, 0.98));
        --w-tasks-bg: rgba(255, 252, 255, 0.64);
        --w-task-bg: rgba(90, 60, 110, 0.05);
        --w-shadow-1: rgba(90, 60, 110, 0.26);
        --w-shadow-2: rgba(90, 60, 110, 0.18);
        --w-scroll: rgba(90, 60, 110, 0.25);
      }

      .widget[data-theme="sage"] {
        color-scheme: dark;
        --w-text: #eef4f0;
        --w-title: #f0f6f2;
        --w-muted: #c3d3cb;
        --w-subtle: #8fa79c;
        --w-border: rgba(190, 214, 203, 0.16);
        --w-border-strong: rgba(190, 214, 203, 0.26);
        --w-hairline: rgba(190, 214, 203, 0.14);
        --w-soft: rgba(148, 187, 170, 0.12);
        --w-soft-2: rgba(148, 187, 170, 0.08);
        --w-bg:
          radial-gradient(130% 90% at 0% 0%, var(--accent-bg), transparent 55%),
          radial-gradient(120% 120% at 100% 4%, rgba(148, 187, 170, 0.10), transparent 52%),
          linear-gradient(165deg, rgba(31, 46, 41, 0.92), rgba(10, 18, 16, 0.95));
        --w-ring-track: rgba(150, 180, 168, 0.16);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(28, 42, 37, 0.92), rgba(10, 18, 16, 0.96));
        --w-tasks-bg: rgba(15, 26, 22, 0.42);
        --w-task-bg: rgba(148, 187, 170, 0.08);
        --w-shadow-1: rgba(3, 12, 9, 0.70);
        --w-shadow-2: rgba(3, 12, 9, 0.55);
      }

      .widget:hover,
      .widget:focus-within {
        opacity: 1;
        border-color: var(--w-border-strong);
        box-shadow:
          inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
          0 30px 70px -20px var(--w-shadow-1),
          0 10px 28px -14px var(--w-shadow-2);
      }

      @keyframes pomodoroWidgetIn {
        from { transform: translateY(10px) scale(.98); }
        to { transform: none; }
      }

      .widget[data-mode="work"] {
        --accent: #c965cb;
        --accent-soft: #f0c4f1;
        --accent-bg: rgba(201, 101, 203, 0.22);
        --accent-text: #2b0630;
      }

      .widget[data-mode="shortBreak"] {
        --accent: #8e90d4;
        --accent-soft: #d2d3f2;
        --accent-bg: rgba(142, 144, 212, 0.22);
        --accent-text: #16173f;
        --on-accent: #16173f;
      }

      .widget[data-mode="longBreak"] {
        --accent: #f5d5e0;
        --accent-soft: #fbeaf0;
        --accent-bg: rgba(245, 213, 224, 0.22);
        --accent-text: #3a0a24;
        --on-accent: #3a0a24;
      }

      /* Per-theme accent palettes */
      .widget[data-theme="daylight"] { --on-accent: #ffffff; }
      .widget[data-theme="daylight"][data-mode="work"] { --accent: #b44e56; --accent-bg: rgba(180, 78, 86, 0.16); }
      .widget[data-theme="daylight"][data-mode="shortBreak"] { --accent: #5560b4; --accent-bg: rgba(85, 96, 180, 0.16); }
      .widget[data-theme="daylight"][data-mode="longBreak"] { --accent: #8e4796; --accent-bg: rgba(142, 71, 150, 0.16); }
      .widget[data-theme="sage"][data-mode="work"] { --accent: #f59e0b; --accent-bg: rgba(245, 158, 11, 0.20); }
      .widget[data-theme="sage"][data-mode="shortBreak"] { --accent: #34d399; --accent-bg: rgba(52, 211, 153, 0.20); }
      .widget[data-theme="sage"][data-mode="longBreak"] { --accent: #a78bfa; --accent-bg: rgba(167, 139, 250, 0.20); }

      /* ---------- Fireflies ---------- */
      .firefly-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        border-radius: inherit;
        pointer-events: none;
      }

      .firefly {
        position: absolute;
        left: var(--fx);
        top: var(--fy);
        width: var(--size);
        height: var(--size);
        margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
        border-radius: 50%;
        opacity: 0;
        background: radial-gradient(circle, var(--firefly-core) 0 30%, var(--firefly-halo) 55%, transparent 76%);
        box-shadow:
          0 0 6px var(--firefly-glow),
          0 0 14px var(--firefly-glow);
        will-change: transform, opacity;
        animation:
          pomodoroFireflyDrift var(--drift-dur) ease-in-out var(--drift-delay) infinite both,
          pomodoroFireflyGlow var(--glow-dur) ease-in-out var(--glow-delay) infinite both;
      }

      .firefly-layer.is-active .firefly {
        box-shadow:
          0 0 8px var(--firefly-glow),
          0 0 20px var(--firefly-glow);
      }

      @keyframes pomodoroFireflyDrift {
        0%   { transform: translate3d(0, 0, 0) scale(.85); }
        20%  { transform: translate3d(var(--x1), var(--y1), 0) scale(1.05); }
        40%  { transform: translate3d(var(--x2), var(--y2), 0) scale(.9); }
        60%  { transform: translate3d(var(--x3), var(--y3), 0) scale(1.12); }
        80%  { transform: translate3d(var(--x4), var(--y4), 0) scale(.95); }
        100% { transform: translate3d(0, 0, 0) scale(.85); }
      }

      @keyframes pomodoroFireflyGlow {
        0%, 100% { opacity: .10; }
        20% { opacity: .85; }
        45% { opacity: .28; }
        70% { opacity: 1; }
        85% { opacity: .45; }
      }

      /* ---------- Header ---------- */
      .drag {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 40px;
        padding: 12px 14px 8px;
        cursor: grab;
        touch-action: none;
      }

      .drag:active {
        cursor: grabbing;
      }

      .dot {
        width: 9px;
        height: 9px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: var(--accent);
        box-shadow:
          0 0 10px var(--accent),
          0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
        animation: pomodoroDotPulse 2.6s ease-in-out infinite;
      }

      @keyframes pomodoroDotPulse {
        0%, 100% { box-shadow: 0 0 8px var(--accent), 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
        50% { box-shadow: 0 0 15px var(--accent), 0 0 0 7px color-mix(in srgb, var(--accent) 5%, transparent); }
      }

      .title {
        min-width: 0;
        flex: 1;
        color: var(--w-title);
        font-size: calc(13px * var(--text-scale, 1));
        font-weight: 800;
        letter-spacing: -0.2px;
      }

      .drag-label {
        color: var(--w-subtle);
        font-size: calc(9px * var(--text-scale, 1));
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        padding: 3px 8px;
        border-radius: 999px;
        background: var(--w-soft);
        border: 1px solid var(--w-hairline);
      }

      .close {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        min-height: 22px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--w-hairline);
        background: var(--w-soft);
        color: var(--w-subtle);
        font-size: calc(15px * var(--text-scale, 1));
        line-height: 1;
        cursor: pointer;
        transition: background .15s ease, color .15s ease, border-color .15s ease, transform .15s ease;
      }

      .close:hover {
        color: #fff;
        background: #c0304a;
        border-color: #c0304a;
        transform: none;
      }

      /* ---------- Main ---------- */
      .main {
        position: relative;
        z-index: 1;
        padding: 2px 14px 14px;
        cursor: pointer;
      }

      .timer-row {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 14px;
        align-items: center;
      }

      .ring {
        --progress: 0deg;
        position: relative;
        width: 84px;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: conic-gradient(var(--accent) var(--progress), var(--w-ring-track) 0);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.05),
          0 0 20px -4px color-mix(in srgb, var(--accent) 45%, transparent);
        transition: background .4s linear;
      }

      .ring-inner {
        width: 76%;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--w-ring-inner);
        box-shadow: inset 0 0 14px var(--w-shadow-2);
      }

      .mini-time {
        color: var(--w-text);
        font-size: calc(12px * var(--text-scale, 1));
        font-weight: 800;
        letter-spacing: -0.3px;
        font-variant-numeric: tabular-nums;
      }

      .time {
        color: var(--w-text);
        font-size: 38px;
        font-weight: 800;
        letter-spacing: -1.5px;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 6px 20px var(--w-shadow-2);
      }

      .mode {
        margin-top: 6px;
        color: var(--accent);
        font-size: calc(11px * var(--text-scale, 1));
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      /* ---------- Controls ---------- */
      .controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
        margin-top: 14px;
      }

      button {
        appearance: none;
        border: 0;
        min-height: 36px;
        padding: 8px 10px;
        border-radius: 12px;
        font: inherit;
        font-size: calc(12px * var(--text-scale, 1));
        font-weight: 800;
        cursor: pointer;
        transition: transform .15s ease, background .2s ease, box-shadow .2s ease, opacity .2s ease;
      }

      button:active:not(:disabled) {
        transform: scale(.98);
      }

      button.primary {
        color: var(--on-accent);
        background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 88%, white 12%), var(--accent));
        box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--accent) 70%, transparent);
      }

      button.primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px -8px color-mix(in srgb, var(--accent) 78%, transparent);
      }

      button.secondary {
        color: var(--w-text);
        background: var(--w-soft);
        border: 1px solid var(--w-hairline);
      }

      button.secondary:hover:not(:disabled) {
        transform: translateY(-1px);
        background: var(--w-soft);
        border-color: var(--w-border-strong);
      }

      button:disabled {
        opacity: .42;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* ---------- Tasks ---------- */
      .tasks-block {
        margin-top: 14px;
        padding: 11px;
        border: 1px solid var(--w-hairline);
        border-radius: 16px;
        background: var(--w-tasks-bg);
      }

      .tasks-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }

      .tasks-title {
        color: var(--w-muted);
        font-size: calc(10px * var(--text-scale, 1));
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .open {
        color: var(--w-muted);
        background: transparent;
        border: 1px solid var(--w-border);
        min-height: 24px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: calc(10px * var(--text-scale, 1));
        font-weight: 700;
      }

      .open:hover {
        background: var(--w-soft);
        transform: none;
      }

      .tasks {
        display: grid;
        gap: 6px;
        max-height: 104px;
        margin: 0;
        padding: 0;
        overflow: auto;
        list-style: none;
        scrollbar-width: thin;
        scrollbar-color: var(--w-scroll) transparent;
      }

      .tasks::-webkit-scrollbar {
        width: 6px;
      }

      .tasks::-webkit-scrollbar-thumb {
        background: var(--w-scroll);
        border-radius: 999px;
      }

      .task {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        min-height: 30px;
        padding: 6px 8px;
        border-radius: 11px;
        background: var(--w-task-bg);
        border: 1px solid var(--w-soft-2);
        transition: background .2s ease;
      }

      .task:hover {
        background: var(--w-soft);
      }

      .task.soon {
        box-shadow: inset 3px 0 0 0 #d9932e;
      }

      .task.overdue {
        box-shadow: inset 3px 0 0 0 #c0304a;
      }

      .task input {
        width: 15px;
        height: 15px;
        margin: 0;
        accent-color: var(--accent);
        cursor: pointer;
      }

      .task span {
        min-width: 0;
        color: var(--w-text);
        font-size: calc(12px * var(--text-scale, 1));
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .task.done span {
        color: var(--w-subtle);
        text-decoration: line-through;
      }

      .empty {
        color: var(--w-subtle);
        font-size: calc(11.5px * var(--text-scale, 1));
        line-height: 1.4;
        padding: 4px 2px;
      }

      .hint {
        margin-top: 10px;
        color: var(--w-subtle);
        font-size: calc(9.5px * var(--text-scale, 1));
        line-height: 1.3;
        text-align: center;
      }

      @media (prefers-reduced-motion: reduce) {
        .firefly-layer {
          display: none;
        }

        .widget,
        .dot {
          animation: none;
        }
      }

      @media (max-width: 520px) {
        :host {
          width: 240px;
        }

        .widget {
          width: 240px;
        }

        .time {
          font-size: 33px;
        }

        .timer-row {
          grid-template-columns: 74px minmax(0, 1fr);
        }

        .ring {
          width: 74px;
        }
      }
    `;

    const wrapper = document.createElement("section");
    wrapper.className = "widget";
    wrapper.innerHTML = `
      <div class="firefly-layer" aria-hidden="true"></div>
      <div class="drag" part="drag">
        <span class="dot"></span>
        <span class="title"></span>
        <span class="drag-label"></span>
        <button class="close" type="button">×</button>
      </div>
      <div class="main">
        <div class="timer-row">
          <div class="ring">
            <div class="ring-inner"><span class="mini-time"></span></div>
          </div>
          <div>
            <div class="time"></div>
            <div class="mode"></div>
          </div>
        </div>
        <div class="controls">
          <button class="primary start" type="button"></button>
          <button class="secondary pause" type="button"></button>
        </div>
        <div class="tasks-block">
          <div class="tasks-head">
            <span class="tasks-title"></span>
            <button class="open" type="button"></button>
          </div>
          <ul class="tasks"></ul>
        </div>
        <div class="hint"></div>
      </div>
    `;

    root.append(style, wrapper);
    document.documentElement.appendChild(host);

    nodes = {
      widget: wrapper,
      fireflyLayer: wrapper.querySelector(".firefly-layer"),
      drag: wrapper.querySelector(".drag"),
      title: wrapper.querySelector(".title"),
      dragLabel: wrapper.querySelector(".drag-label"),
      closeBtn: wrapper.querySelector(".close"),
      time: wrapper.querySelector(".time"),
      miniTime: wrapper.querySelector(".mini-time"),
      mode: wrapper.querySelector(".mode"),
      ring: wrapper.querySelector(".ring"),
      startBtn: wrapper.querySelector(".start"),
      pauseBtn: wrapper.querySelector(".pause"),
      openBtn: wrapper.querySelector(".open"),
      tasksTitle: wrapper.querySelector(".tasks-title"),
      tasksList: wrapper.querySelector(".tasks"),
      hint: wrapper.querySelector(".hint"),
      main: wrapper.querySelector(".main")
    };

    bindEvents();
  }

  function bindEvents() {
    nodes.drag.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag);

    nodes.startBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const response = await safeSend("START");
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    nodes.pauseBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const response = await safeSend("PAUSE");
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    nodes.openBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await safeSend("OPEN_SIDE_PANEL");
    });

    nodes.closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      // Non-destructive: hide the widget only on this page for this session.
      // It returns on reload and appears on other tabs; the settings toggle
      // ("Floating widget on websites") remains the permanent on/off.
      sessionDismissed = true;
      render();
    });

    nodes.main.addEventListener("click", async (event) => {
      if (movedDuringPointer) return;
      if (event.target.closest("button, input")) return;
      await safeSend("OPEN_SIDE_PANEL");
    });

    nodes.tasksList.addEventListener("click", async (event) => {
      const checkbox = event.target.closest("input[type='checkbox']");
      if (!checkbox) return;

      event.stopPropagation();

      const li = checkbox.closest(".task");
      const response = await safeSend("TOGGLE_TASK", { id: li?.dataset?.id });
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    window.addEventListener("resize", () => {
      clampAndApplyPosition();
      savePosition();
    });

    document.addEventListener("visibilitychange", () => {
      syncFireflyTimer(true);
    });
  }

  function startDrag(event) {
    if (!host) return;

    // Don't start a drag when pressing a control inside the header (e.g. close).
    if (event.target.closest("button")) return;

    movedDuringPointer = false;

    const rect = host.getBoundingClientRect();

    drag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY
    };

    nodes.drag.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = Math.abs(event.clientX - drag.startX);
    const dy = Math.abs(event.clientY - drag.startY);
    if (dx > 3 || dy > 3) movedDuringPointer = true;

    position = {
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY
    };

    clampAndApplyPosition();
    event.preventDefault();
  }

  async function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    nodes.drag.releasePointerCapture?.(event.pointerId);
    drag = null;
    await savePosition();

    setTimeout(() => {
      movedDuringPointer = false;
    }, 80);
  }

  function clampAndApplyPosition() {
    if (!host) return;

    const rect = host.getBoundingClientRect();
    const width = rect.width || 264;
    const height = rect.height || 300;
    const padding = 10;

    if (!position) {
      position = {
        x: Math.max(padding, window.innerWidth - width - 24),
        y: Math.min(Math.max(96, padding), Math.max(padding, window.innerHeight - height - padding))
      };
    }

    position.x = Math.min(Math.max(padding, position.x), Math.max(padding, window.innerWidth - width - padding));
    position.y = Math.min(Math.max(padding, position.y), Math.max(padding, window.innerHeight - height - padding));

    host.style.left = `${Math.round(position.x)}px`;
    host.style.top = `${Math.round(position.y)}px`;
  }

  async function savePosition() {
    if (!position) return;

    try {
      await chrome.storage.local.set({ [POSITION_KEY]: position });
    } catch (error) {
      // Ignore storage errors in restricted contexts.
    }
  }

  async function loadPosition() {
    try {
      const data = await chrome.storage.local.get(POSITION_KEY);
      position = data[POSITION_KEY] || null;
    } catch (error) {
      position = null;
    }
  }

  const FIREFLY_PALETTE = {
    midnight: {
      work: { core: "rgba(255, 224, 245, 1)", halo: "rgba(201, 101, 203, .64)", glow: "rgba(160, 60, 170, .72)" },
      shortBreak: { core: "rgba(228, 229, 255, 1)", halo: "rgba(142, 144, 212, .62)", glow: "rgba(102, 103, 171, .70)" },
      longBreak: { core: "rgba(255, 240, 246, 1)", halo: "rgba(245, 213, 224, .60)", glow: "rgba(226, 170, 196, .66)" }
    },
    daylight: {
      work: { core: "rgba(180, 78, 86, 1)", halo: "rgba(150, 58, 66, .55)", glow: "rgba(180, 78, 86, .48)" },
      shortBreak: { core: "rgba(85, 96, 180, 1)", halo: "rgba(60, 70, 150, .55)", glow: "rgba(85, 96, 180, .48)" },
      longBreak: { core: "rgba(142, 71, 150, 1)", halo: "rgba(110, 50, 118, .55)", glow: "rgba(142, 71, 150, .48)" }
    },
    sage: {
      work: { core: "rgba(255, 237, 190, 1)", halo: "rgba(245, 158, 11, .60)", glow: "rgba(217, 119, 6, .66)" },
      shortBreak: { core: "rgba(209, 250, 229, 1)", halo: "rgba(52, 211, 153, .60)", glow: "rgba(16, 185, 129, .66)" },
      longBreak: { core: "rgba(237, 233, 255, 1)", halo: "rgba(167, 139, 250, .60)", glow: "rgba(139, 92, 246, .66)" }
    }
  };

  function getFireflyColors() {
    const theme = FIREFLY_PALETTE[state?.settings?.theme] || FIREFLY_PALETTE.midnight;
    return theme[state?.mode] || theme.work;
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  }

  function applyFireflyParams(firefly) {
    const rnd = (min, max) => min + Math.random() * (max - min);
    const waypoint = () => `${rnd(-34, 34).toFixed(1)}px`;

    firefly.style.setProperty("--fx", `${rnd(6, 94).toFixed(2)}%`);
    firefly.style.setProperty("--fy", `${rnd(8, 92).toFixed(2)}%`);
    firefly.style.setProperty("--size", `${rnd(3, 6).toFixed(1)}px`);

    firefly.style.setProperty("--x1", waypoint());
    firefly.style.setProperty("--y1", waypoint());
    firefly.style.setProperty("--x2", waypoint());
    firefly.style.setProperty("--y2", waypoint());
    firefly.style.setProperty("--x3", waypoint());
    firefly.style.setProperty("--y3", waypoint());
    firefly.style.setProperty("--x4", waypoint());
    firefly.style.setProperty("--y4", waypoint());

    firefly.style.setProperty("--drift-dur", `${rnd(9, 20).toFixed(1)}s`);
    firefly.style.setProperty("--drift-delay", `${(-rnd(0, 18)).toFixed(1)}s`);
    firefly.style.setProperty("--glow-dur", `${rnd(2.4, 4.8).toFixed(1)}s`);
    firefly.style.setProperty("--glow-delay", `${(-rnd(0, 5)).toFixed(1)}s`);
  }

  function getFireflyCount() {
    // A denser swarm while focusing, a calmer ambient glow otherwise.
    return state?.running ? 16 : 11;
  }

  function startFireflies() {
    const layer = nodes.fireflyLayer;
    if (!layer) return;

    const colors = getFireflyColors();
    layer.style.setProperty("--firefly-core", colors.core);
    layer.style.setProperty("--firefly-halo", colors.halo);
    layer.style.setProperty("--firefly-glow", colors.glow);
    layer.classList.toggle("is-active", Boolean(state?.running));

    const desired = getFireflyCount();

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
    if (nodes.fireflyLayer) {
      nodes.fireflyLayer.replaceChildren();
      nodes.fireflyLayer.classList.remove("is-active");
    }
  }

  function recycleOneFirefly() {
    const layer = nodes.fireflyLayer;
    if (!layer || layer.childElementCount === 0) return;

    // Move a single firefly to a new spot with a fresh flight path, so the
    // swarm keeps evolving (a firefly blinking out here and reappearing there).
    const index = Math.floor(Math.random() * layer.childElementCount);
    const firefly = layer.children[index];
    if (firefly) applyFireflyParams(firefly);
  }

  function syncFireflyTimer(force = false) {
    if (!nodes.fireflyLayer) return;

    const enabled =
      state?.settings?.floatingWidgetEnabled !== false &&
      !sessionDismissed &&
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

  function render() {
    if (!state || !nodes.widget) return;

    if (state.settings?.floatingWidgetEnabled === false || sessionDismissed) {
      host.style.display = "none";
      syncFireflyTimer();
      return;
    }

    host.style.display = "block";
    nodes.widget.dataset.theme = state.settings?.theme || "midnight";
    nodes.widget.style.setProperty("--text-scale", String(getTextScale()));

    const dictionary = t();
    const duration = getDurationMs(state.mode, state.settings);
    const remaining = getRemainingMs();
    const progress = Math.min(100, Math.max(0, 100 - (remaining / duration) * 100));
    const time = formatTime(remaining);
    const activeTasks = (state.tasks || []).filter((task) => !task.done).slice(0, 3);

    nodes.widget.dataset.mode = state.mode;
    nodes.ring.style.setProperty("--progress", `${progress * 3.6}deg`);

    nodes.title.textContent = dictionary.title;
    nodes.dragLabel.textContent = dictionary.drag;
    nodes.closeBtn.title = dictionary.closeTitle;
    nodes.closeBtn.setAttribute("aria-label", dictionary.close);
    nodes.startBtn.textContent = dictionary.start;
    nodes.pauseBtn.textContent = dictionary.pause;
    nodes.openBtn.textContent = dictionary.open;
    nodes.tasksTitle.textContent = dictionary.tasks;
    nodes.hint.textContent = dictionary.openHint;

    nodes.time.textContent = time;
    nodes.miniTime.textContent = time;
    nodes.mode.textContent = getModeLabel(state.mode);

    nodes.startBtn.disabled = state.running;
    nodes.pauseBtn.disabled = !state.running;

    nodes.tasksList.innerHTML = "";

    if (!activeTasks.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = dictionary.noTasks;
      nodes.tasksList.appendChild(empty);
    } else {
      for (const task of activeTasks) {
        const li = document.createElement("li");
        li.className = `task ${task.done ? "done" : ""}`;
        const urgency = deadlineUrgency(task.deadline, task.done);
        if (urgency) li.classList.add(urgency);
        li.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;

        const text = document.createElement("span");
        text.textContent = task.text;

        li.append(checkbox, text);
        nodes.tasksList.appendChild(li);
      }
    }

    clampAndApplyPosition();
    syncFireflyTimer();
  }

  async function loadState() {
    const response = await safeSend("GET_STATE");
    if (response.ok) {
      state = response.state;
      render();
    }
  }

  async function init() {
    if (!chrome?.runtime?.id) return;

    createWidget();
    await loadPosition();
    await loadState();

    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.pomodoro?.newValue) {
          state = changes.pomodoro.newValue;
          render();
        }

        if (areaName === "local" && changes[POSITION_KEY]?.newValue) {
          position = changes[POSITION_KEY].newValue;
          clampAndApplyPosition();
        }
      });
    } catch (error) {
      // Extension context may be invalidated during reload.
    }

    setInterval(render, 500);
  }

  init();
})();
