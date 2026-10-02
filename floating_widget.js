(() => {
  /*
   * A copy already here can only be one left behind by an extension that was
   * disabled, removed or reloaded — Chrome injects this script once per page.
   * That copy can no longer reach the extension, so take over from it instead
   * of bowing out to a dead widget.
   */
  const previous = window.__POMODORO_FLOATING_WIDGET__;
  if (typeof previous?.teardown === "function") previous.teardown();

  /*
   * Two things float over the page, each dragged and remembered on its own:
   *
   * - the timer — a small card with the ring, the time and Start/Pause. It
   *   keeps the storage key the old one-piece widget used, so its position
   *   carries over;
   * - the cat — the study buddy from buddy.js standing on a little toolbar,
   *   with the open tasks in a card underneath.
   *
   * Both live in one shadow root, so no page style reaches them.
   */
  const TIMER_POSITION_KEY = "pomodoroFloatingPosition";
  const BUDDY_POSITION_KEY = "pomodoroBuddyPosition";
  const HOST_ID = "ai-pomodoro-floating-widget-host";
  const MAX_TASKS = 4;

  const i18n = {
    uk: {
      close: "Сховати",
      closeTitle: "Сховати на цій сторінці (з'явиться знову після перезавантаження)",
      collapseTitle: "Сховати задачі",
      expandTitle: "Показати задачі",
      start: "Старт",
      pause: "Пауза",
      focus: "Робота",
      shortBreak: "Перерва",
      longBreak: "Довга перерва",
      tasks: "Задачі",
      noTasks: "Задач ще немає — додай першу",
      more: "і ще {n}",
      taskPlaceholder: "Нова задача…",
      addTaskAria: "Додати задачу",
      addDeadlineTitle: "Додати дедлайн",
      deadlineTitle: "Дедлайн задачі",
      purr: "Мурчання котика",
      catToolbar: "Котик і задачі",
      openHint: "Відкрити повну панель"
    },
    en: {
      close: "Hide",
      closeTitle: "Hide on this page (comes back after reload)",
      collapseTitle: "Hide tasks",
      expandTitle: "Show tasks",
      start: "Start",
      pause: "Pause",
      focus: "Focus",
      shortBreak: "Break",
      longBreak: "Long break",
      tasks: "Tasks",
      noTasks: "No tasks yet — add the first one",
      more: "and {n} more",
      taskPlaceholder: "New task…",
      addTaskAria: "Add task",
      addDeadlineTitle: "Add deadline",
      deadlineTitle: "Task deadline",
      purr: "Cat purring",
      catToolbar: "Cat and tasks",
      openHint: "Open the full panel"
    },
    de: {
      close: "Ausblenden",
      closeTitle: "Auf dieser Seite ausblenden (erscheint nach dem Neuladen wieder)",
      collapseTitle: "Aufgaben ausblenden",
      expandTitle: "Aufgaben anzeigen",
      start: "Start",
      pause: "Pause",
      focus: "Fokus",
      shortBreak: "Pause",
      longBreak: "Lange Pause",
      tasks: "Aufgaben",
      noTasks: "Noch keine Aufgaben — füge die erste hinzu",
      more: "und {n} weitere",
      taskPlaceholder: "Neue Aufgabe…",
      addTaskAria: "Aufgabe hinzufügen",
      addDeadlineTitle: "Frist hinzufügen",
      deadlineTitle: "Frist der Aufgabe",
      purr: "Schnurren",
      catToolbar: "Katze und Aufgaben",
      openHint: "Das volle Panel öffnen"
    },
    es: {
      close: "Ocultar",
      closeTitle: "Ocultar en esta página (vuelve al recargar)",
      collapseTitle: "Ocultar tareas",
      expandTitle: "Mostrar tareas",
      start: "Iniciar",
      pause: "Pausa",
      focus: "Enfoque",
      shortBreak: "Descanso",
      longBreak: "Descanso largo",
      tasks: "Tareas",
      noTasks: "Aún no hay tareas: añade la primera",
      more: "y {n} más",
      taskPlaceholder: "Nueva tarea…",
      addTaskAria: "Añadir tarea",
      addDeadlineTitle: "Añadir fecha límite",
      deadlineTitle: "Fecha límite de la tarea",
      purr: "Ronroneo",
      catToolbar: "Gato y tareas",
      openHint: "Abrir el panel completo"
    },
    it: {
      close: "Nascondi",
      closeTitle: "Nascondi in questa pagina (riappare al ricaricamento)",
      collapseTitle: "Nascondi le attività",
      expandTitle: "Mostra le attività",
      start: "Avvia",
      pause: "Pausa",
      focus: "Concentrazione",
      shortBreak: "Pausa",
      longBreak: "Pausa lunga",
      tasks: "Attività",
      noTasks: "Ancora nessuna attività: aggiungi la prima",
      more: "e altre {n}",
      taskPlaceholder: "Nuova attività…",
      addTaskAria: "Aggiungi attività",
      addDeadlineTitle: "Aggiungi scadenza",
      deadlineTitle: "Scadenza dell'attività",
      purr: "Fusa del gatto",
      catToolbar: "Gatto e attività",
      openHint: "Apri il pannello completo"
    },
    sk: {
      close: "Skryť",
      closeTitle: "Skryť na tejto stránke (znova sa zobrazí po obnovení)",
      collapseTitle: "Skryť úlohy",
      expandTitle: "Zobraziť úlohy",
      start: "Štart",
      pause: "Pauza",
      focus: "Fokus",
      shortBreak: "Prestávka",
      longBreak: "Dlhá prestávka",
      tasks: "Úlohy",
      noTasks: "Zatiaľ žiadne úlohy — pridaj prvú",
      more: "a ďalšie {n}",
      taskPlaceholder: "Nová úloha…",
      addTaskAria: "Pridať úlohu",
      addDeadlineTitle: "Pridať termín",
      deadlineTitle: "Termín úlohy",
      purr: "Priadenie mačky",
      catToolbar: "Mačka a úlohy",
      openHint: "Otvoriť celý panel"
    },
    cs: {
      close: "Skrýt",
      closeTitle: "Skrýt na této stránce (znovu se zobrazí po obnovení)",
      collapseTitle: "Skrýt úkoly",
      expandTitle: "Zobrazit úkoly",
      start: "Start",
      pause: "Pauza",
      focus: "Fokus",
      shortBreak: "Přestávka",
      longBreak: "Dlouhá přestávka",
      tasks: "Úkoly",
      noTasks: "Zatím žádné úkoly — přidej první",
      more: "a další {n}",
      taskPlaceholder: "Nový úkol…",
      addTaskAria: "Přidat úkol",
      addDeadlineTitle: "Přidat termín",
      deadlineTitle: "Termín úkolu",
      purr: "Předení kočky",
      catToolbar: "Kočka a úkoly",
      openHint: "Otevřít celý panel"
    }
  };

  let state = null;
  let host;
  let root;
  let nodes = {};
  // Where each piece sits, and whether × hid it on this page.
  const positions = { timer: null, buddy: null };
  const dismissed = { timer: false, buddy: false };
  let drag = null;
  let movedDuringPointer = false;
  let formOpen = false;
  let fireflyRecycleTimer = null;
  let fireflyConfigKey = "";
  // Fingerprint of the rendered task list, so a 500 ms tick does not rebuild
  // it under an open date picker.
  let tasksSignature = "";
  let renderTimer = null;
  let tornDown = false;
  // The cat is made lazily, when the page has a quiet moment: drawing it
  // takes a few dozen milliseconds that page load should not pay for.
  let buddy = null;
  let buddyPending = null;

  /*
   * Turning the extension off does not take this script off pages that are
   * already open: Chrome leaves it running, cut off from the extension, and
   * the widget would sit there ticking down a timer nobody can start or stop.
   * chrome.runtime.id is gone from that moment, which is how it can tell.
   */
  function extensionAlive() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch (error) {
      return false;
    }
  }

  /* Take the widget off the page and stop everything it was running. */
  function teardown() {
    if (tornDown) return;
    tornDown = true;

    clearInterval(renderTimer);
    clearInterval(fireflyRecycleTimer);
    cancelBuddyCreation();
    buddy?.destroy();
    window.removeEventListener("pointermove", moveDrag);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    try {
      chrome.storage.onChanged.removeListener(onStorageChanged);
    } catch (error) {
      // The connection is already gone — nothing left to unhook.
    }

    host?.remove();
    host = null;
    nodes = {};
    buddy = null;

    if (window.__POMODORO_FLOATING_WIDGET__?.teardown === teardown) {
      window.__POMODORO_FLOATING_WIDGET__ = null;
    }
  }

  window.__POMODORO_FLOATING_WIDGET__ = { teardown };

  function safeSend(type, payload = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type, ...payload }, (response) => {
          if (chrome.runtime.lastError) {
            if (!extensionAlive()) teardown();
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || { ok: false });
        });
      } catch (error) {
        if (!extensionAlive()) teardown();
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

  const STYLES = `
      :host {
        all: initial;
        position: fixed;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
        z-index: 2147483647;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      [hidden] {
        display: none !important;
      }

      .fw {
        /* Surface tokens — default theme: Midnight (see .fw[data-theme]).
           Palette "Moon": deep violet glass, moonlit pink ink. */
        --w-text: #f2e2ec;
        --w-muted: #d5b6ca;
        --w-subtle: #ab8bb6;
        --w-border: rgba(232, 200, 240, 0.16);
        --w-border-strong: rgba(232, 200, 240, 0.30);
        --w-hairline: rgba(232, 200, 240, 0.12);
        --w-soft: rgba(228, 190, 236, 0.12);
        --w-soft-2: rgba(228, 190, 236, 0.07);
        --w-glass:
          radial-gradient(130% 120% at 0% 0%, var(--accent-bg), transparent 60%),
          linear-gradient(165deg, rgba(58, 12, 68, 0.93), rgba(22, 4, 34, 0.95));
        --w-pill: linear-gradient(180deg, rgba(48, 10, 58, 0.94), rgba(26, 5, 38, 0.96));
        --w-ring-track: rgba(200, 170, 215, 0.2);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(58, 11, 69, 0.96), rgba(18, 3, 28, 0.98));
        --w-task-bg: rgba(228, 190, 236, 0.07);
        --w-shadow-1: rgba(12, 2, 20, 0.7);
        --w-shadow-2: rgba(12, 2, 20, 0.55);
        --w-scroll: rgba(228, 190, 236, 0.3);
        --on-accent: #2b0630;
        --buddy-ink: var(--w-muted);
        --text-scale: 1;
        color: var(--w-text);
        color-scheme: dark;
      }

      .fw[data-theme="daylight"] {
        color-scheme: light;
        --w-text: #3a2c46;
        --w-muted: #5f4f70;
        --w-subtle: #77678a;
        --w-border: rgba(90, 60, 110, 0.14);
        --w-border-strong: rgba(90, 60, 110, 0.26);
        --w-hairline: rgba(90, 60, 110, 0.11);
        --w-soft: rgba(90, 60, 110, 0.07);
        --w-soft-2: rgba(90, 60, 110, 0.04);
        --w-glass:
          radial-gradient(130% 120% at 0% 0%, var(--accent-bg), transparent 62%),
          linear-gradient(165deg, rgba(255, 251, 255, 0.95), rgba(246, 230, 238, 0.95));
        --w-pill: linear-gradient(180deg, rgba(255, 252, 255, 0.96), rgba(244, 232, 244, 0.96));
        --w-ring-track: rgba(90, 60, 110, 0.18);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(255, 253, 255, 0.98), rgba(246, 236, 246, 0.98));
        --w-task-bg: rgba(90, 60, 110, 0.05);
        --w-shadow-1: rgba(90, 60, 110, 0.26);
        --w-shadow-2: rgba(90, 60, 110, 0.16);
        --w-scroll: rgba(90, 60, 110, 0.25);
      }

      .fw[data-theme="sage"] {
        --w-text: #eef4f0;
        --w-muted: #c3d3cb;
        --w-subtle: #8fa79c;
        --w-border: rgba(190, 214, 203, 0.15);
        --w-border-strong: rgba(190, 214, 203, 0.26);
        --w-hairline: rgba(190, 214, 203, 0.12);
        --w-soft: rgba(148, 187, 170, 0.12);
        --w-soft-2: rgba(148, 187, 170, 0.07);
        --w-glass:
          radial-gradient(130% 120% at 0% 0%, var(--accent-bg), transparent 60%),
          linear-gradient(165deg, rgba(31, 46, 41, 0.93), rgba(10, 18, 16, 0.95));
        --w-pill: linear-gradient(180deg, rgba(28, 42, 37, 0.95), rgba(12, 21, 18, 0.96));
        --w-ring-track: rgba(150, 180, 168, 0.18);
        --w-ring-inner: radial-gradient(circle at 50% 34%, rgba(28, 42, 37, 0.95), rgba(10, 18, 16, 0.97));
        --w-task-bg: rgba(148, 187, 170, 0.07);
        --w-shadow-1: rgba(3, 12, 9, 0.68);
        --w-shadow-2: rgba(3, 12, 9, 0.5);
      }

      .fw[data-mode="work"] {
        --accent: #d45fce;
        --accent-soft: #f3c7f0;
        --accent-bg: rgba(212, 95, 206, 0.2);
      }

      .fw[data-mode="shortBreak"] {
        --accent: #4fc9e0;
        --accent-soft: #bfedf5;
        --accent-bg: rgba(79, 201, 224, 0.2);
        --on-accent: #04252c;
      }

      .fw[data-mode="longBreak"] {
        --accent: #9a8cf2;
        --accent-soft: #dcd6fd;
        --accent-bg: rgba(154, 140, 242, 0.2);
        --on-accent: #1a1650;
      }

      /* Per-theme accent palettes */
      .fw[data-theme="daylight"] { --on-accent: #ffffff; }
      .fw[data-theme="daylight"][data-mode="work"] { --accent: #b84a5c; --accent-bg: rgba(184, 74, 92, 0.14); }
      .fw[data-theme="daylight"][data-mode="shortBreak"] { --accent: #3c63c8; --accent-bg: rgba(60, 99, 200, 0.14); }
      .fw[data-theme="daylight"][data-mode="longBreak"] { --accent: #9333a5; --accent-bg: rgba(147, 51, 165, 0.14); }
      .fw[data-theme="sage"][data-mode="work"] { --accent: #f59e0b; --accent-bg: rgba(245, 158, 11, 0.18); }
      .fw[data-theme="sage"][data-mode="shortBreak"] { --accent: #34d399; --accent-bg: rgba(52, 211, 153, 0.18); }
      .fw[data-theme="sage"][data-mode="longBreak"] { --accent: #a78bfa; --accent-bg: rgba(167, 139, 250, 0.18); }

      /* ---------- Two pieces, each floating on its own ---------- */
      .piece {
        position: fixed;
        left: 0;
        top: 0;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
        animation: pieceIn 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }

      @keyframes pieceIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: none; }
      }

      .piece.is-dragging {
        cursor: grabbing;
      }

      /* The glass shared by the timer, the toolbar and the task card. */
      .glass {
        border: 1px solid var(--w-border);
        background: var(--w-glass);
        box-shadow:
          inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
          0 22px 50px -22px var(--w-shadow-1),
          0 8px 20px -12px var(--w-shadow-2);
        -webkit-backdrop-filter: blur(18px) saturate(1.2);
        backdrop-filter: blur(18px) saturate(1.2);
      }

      button {
        appearance: none;
        margin: 0;
        border: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        transition: transform 0.15s ease, background 0.2s ease, color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
      }

      button:focus-visible,
      input:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      /* × — hides a piece on this page only; shows itself on hover. */
      .hide {
        position: absolute;
        top: -7px;
        right: -7px;
        z-index: 3;
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--w-border);
        background: var(--w-pill);
        color: var(--w-subtle);
        font-size: 14px;
        line-height: 1;
        opacity: 0;
        box-shadow: 0 4px 12px -4px var(--w-shadow-2);
      }

      .piece:hover .hide,
      .piece:focus-within .hide {
        opacity: 1;
      }

      .hide:hover {
        color: #fff;
        background: #c0304a;
        border-color: #c0304a;
      }

      /* ---------- The timer ---------- */
      .timer {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        width: calc(230px + 20px * (var(--text-scale) - 1));
        padding: 9px 10px 9px 9px;
        border-radius: 24px;
        color: var(--w-text);
        cursor: grab;
      }

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

      .ring {
        --progress: 0deg;
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        padding: 0;
        border-radius: 50%;
        background: conic-gradient(var(--accent) var(--progress), var(--w-ring-track) 0);
        box-shadow: 0 0 18px -4px color-mix(in srgb, var(--accent) 50%, transparent);
      }

      .ring-inner {
        width: 74%;
        height: 74%;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--w-ring-inner);
      }

      /* While it runs, a firefly glows in the middle of the ring. */
      .ring-inner::after {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent);
        opacity: 0.35;
        transition: opacity 0.3s ease;
      }

      .fw[data-running="true"] .ring-inner::after {
        opacity: 1;
        animation: ringPulse 2.4s ease-in-out infinite;
      }

      @keyframes ringPulse {
        50% { box-shadow: 0 0 14px var(--accent); transform: scale(0.8); }
      }

      .readout {
        position: relative;
        z-index: 1;
        min-width: 0;
        padding: 0;
        text-align: left;
        background: none;
      }

      .time {
        display: block;
        color: var(--w-text);
        font-size: 28px;
        font-weight: 950;
        line-height: 0.95;
        letter-spacing: -0.05em;
        font-variant-numeric: tabular-nums;
      }

      .mode {
        display: block;
        margin-top: 4px;
        overflow: hidden;
        color: var(--accent);
        font-size: calc(10.5px * var(--text-scale, 1));
        font-weight: 900;
        letter-spacing: 0.04em;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .actions {
        position: relative;
        z-index: 1;
        display: flex;
        gap: 6px;
      }

      .round {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border-radius: 999px;
        color: var(--w-text);
        background: var(--w-soft);
        border: 1px solid var(--w-hairline);
      }

      .round.primary {
        color: var(--on-accent);
        border-color: transparent;
        background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 86%, white 14%), var(--accent));
        box-shadow: 0 8px 18px -8px color-mix(in srgb, var(--accent) 70%, transparent);
      }

      .round:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      /* ---------- The cat, its toolbar and the tasks ---------- */
      .companion {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: calc(268px + 36px * (var(--text-scale) - 1));
      }

      .stage {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: center;
        min-width: 120px;
        cursor: grab;
      }

      /* The lane is exactly as wide as the cat, so it never walks off: it
         stands while the timer runs, sits when it stops, and dozes off. */
      .stage .buddy {
        --buddy-size: 140px;
        width: calc(var(--px) * 68px);
        /* paws on the toolbar's top edge, the ground shadow across it */
        margin-bottom: calc(var(--px) * -2px);
      }

      .pill {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 4px;
        border-radius: 999px;
        border: 1px solid var(--w-border);
        background: var(--w-pill);
        box-shadow:
          inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
          0 14px 30px -16px var(--w-shadow-1);
      }

      .pill-btn {
        display: grid;
        place-items: center;
        width: 38px;
        height: 32px;
        padding: 0;
        border-radius: 999px;
        color: var(--w-muted);
        background: transparent;
      }

      .pill-btn:hover:not(:disabled) {
        color: var(--w-text);
        background: var(--w-soft);
      }

      .pill-btn[aria-pressed="true"] {
        color: var(--accent);
        background: var(--w-soft);
      }

      .pill-btn svg {
        width: 18px;
        height: 18px;
      }

      .pill-sep {
        width: 1px;
        height: 18px;
        background: var(--w-border);
      }

      .fold svg {
        transition: transform 0.2s ease;
      }

      .companion[data-folded="true"] .fold svg {
        transform: rotate(180deg);
      }

      /* the purr button hums along while the cat purrs */
      .purr[aria-pressed="true"] .waves {
        animation: hum 0.16s steps(2) infinite;
      }

      @keyframes hum {
        50% { transform: translateX(0.7px); }
      }

      .task-card {
        width: 100%;
        margin-top: 10px;
        padding: 10px;
        border-radius: 20px;
        color: var(--w-text);
        cursor: grab;
      }

      .companion[data-folded="true"] .task-card {
        display: none;
      }

      .task-form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 30px;
        gap: 6px;
        margin-bottom: 8px;
      }

      .task-input {
        width: 100%;
        min-height: 30px;
        padding: 0 10px;
        border: 1px solid var(--w-border);
        border-radius: 11px;
        outline: none;
        color: var(--w-text);
        background: var(--w-task-bg);
        font: inherit;
        font-size: calc(12px * var(--text-scale, 1));
        user-select: text;
        -webkit-user-select: text;
      }

      .task-input::placeholder {
        color: var(--w-subtle);
      }

      .task-input:focus {
        border-color: var(--accent);
      }

      .task-add {
        min-height: 30px;
        padding: 0;
        border-radius: 11px;
        color: var(--on-accent);
        background: var(--accent);
        font-size: calc(15px * var(--text-scale, 1));
        font-weight: 800;
        line-height: 1;
      }

      .tasks {
        display: grid;
        gap: 6px;
        max-height: 228px;
        margin: 0;
        padding: 0;
        overflow: auto;
        list-style: none;
        scrollbar-width: thin;
        scrollbar-color: var(--w-scroll) transparent;
      }

      .task {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr);
        align-items: start;
        gap: 9px;
        padding: 8px 9px;
        border-radius: 14px;
        background: var(--w-task-bg);
        border: 1px solid var(--w-soft-2);
        transition: background 0.2s ease;
        cursor: default;
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

      /* A round tick, like a notification's check mark. */
      .task input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        display: grid;
        place-items: center;
        width: 18px;
        height: 18px;
        margin: 1px 0 0;
        border: 2px solid var(--w-subtle);
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .task input[type="checkbox"]:hover {
        border-color: var(--accent);
      }

      .task input[type="checkbox"]:checked {
        border-color: var(--accent);
        background: var(--accent);
      }

      .task input[type="checkbox"]:checked::after {
        content: "";
        width: 5px;
        height: 9px;
        margin-top: -2px;
        border: solid var(--on-accent);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      /* With a deadline the date reads as the row's second line, like a
         notification's subtitle; without one, a small calendar sits at the
         end of the title and only shows up properly on hover. */
      .task-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .task:not(.has-deadline) .task-body {
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }

      .task:not(.has-deadline) .task-text {
        flex: 1;
      }

      .task-text {
        max-width: 100%;
        overflow: hidden;
        color: var(--w-text);
        font-size: calc(12.5px * var(--text-scale, 1));
        font-weight: 750;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /*
       * Same chip as the panel: a task without a deadline shrinks to a small
       * calendar affordance so the row stays a glance, and only fills out once
       * there is a date to read.
       */
      .task-deadline {
        width: auto;
        min-width: 112px;
        max-width: 100%;
        min-height: 21px;
        padding: 1px 8px;
        border: 1px solid var(--w-border);
        border-radius: 999px;
        background: var(--w-soft);
        color: var(--w-muted);
        font: inherit;
        font-size: calc(10px * var(--text-scale, 1));
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.15s ease, border-color 0.15s ease;
      }

      .task-deadline.is-empty {
        flex: 0 0 auto;
        min-width: 0;
        padding: 1px 4px;
        border-color: transparent;
        background: none;
        opacity: 0;
      }

      /* only the calendar icon, not an empty dd.mm.yyyy */
      .task-deadline.is-empty::-webkit-datetime-edit {
        display: none;
      }

      .task:hover .task-deadline.is-empty,
      .task-deadline.is-empty:focus {
        opacity: 0.7;
      }

      .task-deadline.is-empty:hover {
        opacity: 1;
      }

      .task-deadline.soon {
        color: #d9932e;
        border-color: rgba(217, 147, 46, 0.5);
        opacity: 1;
      }

      .task-deadline.overdue {
        color: #c0304a;
        border-color: rgba(192, 48, 74, 0.5);
        opacity: 1;
      }

      .empty {
        width: 100%;
        padding: 6px 4px;
        border-radius: 10px;
        color: var(--w-subtle);
        background: none;
        font-size: calc(12px * var(--text-scale, 1));
        line-height: 1.4;
        text-align: left;
      }

      .empty:hover {
        color: var(--w-text);
      }

      .more {
        margin: 7px 2px 0;
        color: var(--w-subtle);
        font-size: calc(11px * var(--text-scale, 1));
      }

      @media (max-height: 560px) {
        .tasks {
          max-height: 108px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .firefly-layer {
          display: none;
        }

        .piece,
        .fw[data-running="true"] .ring-inner::after,
        .purr[aria-pressed="true"] .waves {
          animation: none;
        }
      }
  `;

  const ICONS = {
    play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19.2 8.8a2.3 2.3 0 0 0-3.2-3.2L4.8 16.8 4 20z"/><path d="M14 7.6l3.2 3.2"/></svg>',
    purr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><g class="waves"><path d="M4 10v4M8 7v10M12 4.5v15M16 7v10M20 10v4"/></g></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>'
  };

  function createWidget() {
    // A stale host from a copy that could not clean up after itself (an older
    // version, or another script world after a reload) is dead weight.
    document.getElementById(HOST_ID)?.remove();

    host = document.createElement("div");
    host.id = HOST_ID;

    root = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLES;

    const fw = document.createElement("div");
    fw.className = "fw";
    fw.innerHTML = `
      <section class="piece timer glass">
        <div class="firefly-layer" aria-hidden="true"></div>
        <button class="ring open-panel" type="button"><span class="ring-inner"></span></button>
        <button class="readout open-panel" type="button">
          <span class="time"></span>
          <span class="mode"></span>
        </button>
        <div class="actions">
          <button class="round primary start" type="button">${ICONS.play}</button>
          <button class="round pause" type="button">${ICONS.pause}</button>
        </div>
        <button class="hide hide-timer" type="button">×</button>
      </section>

      <section class="piece companion" data-folded="false">
        <div class="stage">
          <div class="buddy" hidden></div>
          <button class="hide hide-buddy" type="button">×</button>
        </div>
        <div class="pill" role="toolbar">
          <button class="pill-btn add" type="button" aria-pressed="false">${ICONS.pencil}</button>
          <span class="pill-sep" aria-hidden="true"></span>
          <button class="pill-btn purr" type="button" aria-pressed="false">${ICONS.purr}</button>
          <span class="pill-sep" aria-hidden="true"></span>
          <button class="pill-btn fold" type="button" aria-expanded="true">${ICONS.chevron}</button>
        </div>
        <div class="task-card glass">
          <form class="task-form" hidden>
            <input class="task-input" type="text" maxlength="90" />
            <button class="task-add" type="submit">+</button>
          </form>
          <ul class="tasks"></ul>
          <div class="more" hidden></div>
        </div>
      </section>
    `;

    root.append(style, fw);
    document.documentElement.appendChild(host);

    const q = (selector) => fw.querySelector(selector);
    nodes = {
      fw,
      timer: q(".timer"),
      fireflyLayer: q(".firefly-layer"),
      ring: q(".ring"),
      readout: q(".readout"),
      time: q(".time"),
      mode: q(".mode"),
      startBtn: q(".start"),
      pauseBtn: q(".pause"),
      hideTimer: q(".hide-timer"),
      companion: q(".companion"),
      stage: q(".stage"),
      buddyHost: q(".buddy"),
      hideBuddy: q(".hide-buddy"),
      pill: q(".pill"),
      addBtn: q(".add"),
      purrBtn: q(".purr"),
      foldBtn: q(".fold"),
      taskCard: q(".task-card"),
      taskForm: q(".task-form"),
      taskInput: q(".task-input"),
      taskAddBtn: q(".task-add"),
      tasksList: q(".tasks"),
      more: q(".more")
    };

    bindEvents();
  }

  /* ---------- The cat ---------- */

  function cancelBuddyCreation() {
    if (buddyPending === null) return;
    (window.cancelIdleCallback || clearTimeout)(buddyPending);
    buddyPending = null;
  }

  /*
   * The cat is the expensive part — a few dozen milliseconds to draw. It is
   * made in the page's first quiet moment rather than during its load, and
   * only if it is wanted at all.
   */
  function syncBuddy(wanted) {
    const night = (state?.settings?.theme || "midnight") !== "daylight";
    const running = Boolean(state?.running);

    if (buddy) {
      buddy.sync({ enabled: wanted, running, night });
      return;
    }
    if (!wanted || buddyPending !== null || typeof FireflyBuddy === "undefined") return;

    const make = () => {
      buddyPending = null;
      if (tornDown || buddy) return;
      buddy = FireflyBuddy.create(nodes.buddyHost, { onPurrChange: () => render() });
      faceTheMiddle();
      render();
    };
    buddyPending = window.requestIdleCallback
      ? window.requestIdleCallback(make, { timeout: 2500 })
      : setTimeout(make, 400);
  }

  /* The cat looks toward the middle of the screen, whichever side it is on. */
  function faceTheMiddle() {
    if (!buddy || !nodes.companion) return;
    const rect = nodes.companion.getBoundingClientRect();
    buddy.face(rect.left + rect.width / 2 > window.innerWidth / 2 ? -1 : 1);
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    for (const piece of [nodes.timer, nodes.companion]) {
      piece.addEventListener("pointerdown", startDrag);
      // A drag that ends over a button or the cat must not also click it.
      piece.addEventListener("click", (event) => {
        if (!movedDuringPointer) return;
        event.stopPropagation();
        event.preventDefault();
      }, true);
    }
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    nodes.startBtn.addEventListener("click", async () => {
      const response = await safeSend("START");
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    nodes.pauseBtn.addEventListener("click", async () => {
      const response = await safeSend("PAUSE");
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    // The ring and the time open the full panel.
    for (const opener of [nodes.ring, nodes.readout]) {
      opener.addEventListener("click", () => safeSend("OPEN_SIDE_PANEL"));
    }

    // × hides one piece on this page only — non-destructive: it returns on
    // reload and on other tabs; the settings toggle is the permanent switch.
    nodes.hideTimer.addEventListener("click", () => {
      dismissed.timer = true;
      render();
    });

    nodes.hideBuddy.addEventListener("click", () => {
      dismissed.buddy = true;
      buddy?.setPurring(false);
      render();
    });

    nodes.addBtn.addEventListener("click", () => {
      setFormOpen(!formOpen || state?.settings?.floatingWidgetCompact === true);
    });

    nodes.purrBtn.addEventListener("click", () => {
      buddy?.togglePurring();
      render();
    });

    nodes.foldBtn.addEventListener("click", async () => {
      if (!state) return;

      const next = state.settings?.floatingWidgetCompact !== true;

      // Redraw straight away; storage.onChanged confirms it afterwards.
      state = {
        ...state,
        settings: { ...state.settings, floatingWidgetCompact: next }
      };
      if (next) setFormOpen(false);
      render();

      await safeSend("SAVE_SETTINGS", { settings: state.settings });
    });

    // Adding a task from the widget itself, so capturing a thought does not
    // mean leaving the page for the side panel.
    nodes.taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const text = nodes.taskInput.value.trim();
      if (!text) return;

      const response = await safeSend("ADD_TASK", { text });
      if (response.ok) {
        state = response.state;
        nodes.taskInput.value = "";
        render();
      }
    });

    /*
     * The widget lives inside someone else's page. Keystrokes typed here must
     * not reach the site's own shortcut handlers — and because the shadow root
     * retargets events, a site that guards its shortcuts with
     * `target.tagName === "INPUT"` sees the host div instead and fires anyway.
     * Stopping propagation is what keeps a typed "/" from opening their search.
     */
    for (const type of ["keydown", "keyup", "keypress"]) {
      nodes.taskInput.addEventListener(type, (event) => {
        event.stopPropagation();
        if (type === "keydown" && event.key === "Escape") setFormOpen(false);
      });
      // Deadline chips are rebuilt on every change, so guard them by delegation.
      nodes.tasksList.addEventListener(type, (event) => {
        if (event.target.matches("input")) event.stopPropagation();
      });
    }

    // Setting a deadline straight from the widget.
    nodes.tasksList.addEventListener("change", async (event) => {
      if (!event.target.matches("input[type='date']")) return;
      event.stopPropagation();

      const li = event.target.closest(".task");
      if (!li?.dataset?.id) return;

      const response = await safeSend("SET_TASK_DEADLINE", {
        id: li.dataset.id,
        deadline: event.target.value || null
      });
      if (response.ok) {
        state = response.state;
        render();
      }
    });

    nodes.tasksList.addEventListener("click", async (event) => {
      if (event.target.closest(".empty")) {
        setFormOpen(true);
        return;
      }

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

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function setFormOpen(open) {
    formOpen = open;
    if (open && state?.settings?.floatingWidgetCompact === true) {
      // Asked to add a task while the list is folded away: unfold it first.
      state = { ...state, settings: { ...state.settings, floatingWidgetCompact: false } };
      safeSend("SAVE_SETTINGS", { settings: state.settings });
    }
    render();
    if (open) nodes.taskInput?.focus();
  }

  // Named, so teardown() can unhook them.
  function onResize() {
    clampAndApply("timer");
    clampAndApply("buddy");
    faceTheMiddle();
    savePositions();
  }

  function onVisibilityChange() {
    syncFireflyTimer(true);
  }

  function onStorageChanged(changes, areaName) {
    if (areaName !== "local") return;

    if (changes.pomodoro?.newValue) {
      state = changes.pomodoro.newValue;
      render();
    }

    // Moved in another tab — follow it here too.
    for (const [piece, key] of [["timer", TIMER_POSITION_KEY], ["buddy", BUDDY_POSITION_KEY]]) {
      if (changes[key]?.newValue && drag?.piece !== piece) {
        positions[piece] = changes[key].newValue;
        clampAndApply(piece);
      }
    }
  }

  /* ---------- Dragging ---------- */

  function pieceNode(piece) {
    return piece === "timer" ? nodes.timer : nodes.companion;
  }

  function startDrag(event) {
    if (event.button !== 0) return;
    // Controls keep their own clicks; the cat itself is fair game — a tap
    // pets it, a drag moves it.
    if (event.target.closest("input, form, .hide, .pill-btn, .round, .task-deadline")) return;

    const piece = event.currentTarget === nodes.timer ? "timer" : "buddy";
    const rect = pieceNode(piece).getBoundingClientRect();

    movedDuringPointer = false;
    drag = {
      piece,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      captured: false
    };
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = Math.abs(event.clientX - drag.startX);
    const dy = Math.abs(event.clientY - drag.startY);
    if (!movedDuringPointer && dx <= 3 && dy <= 3) return;

    // Only capture once it really is a drag: capturing on press would steal
    // the click from the cat (petting) and from the open-panel buttons.
    if (!drag.captured) {
      drag.captured = true;
      movedDuringPointer = true;
      const node = pieceNode(drag.piece);
      node.classList.add("is-dragging");
      try {
        node.setPointerCapture(event.pointerId);
      } catch (error) {
        // The pointer is already gone; the window listeners still follow it.
      }
    }

    positions[drag.piece] = {
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY
    };

    clampAndApply(drag.piece);
    event.preventDefault();
  }

  async function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const { piece, captured } = drag;
    const node = pieceNode(piece);
    if (captured) {
      node.classList.remove("is-dragging");
      try {
        node.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Nothing was captured.
      }
    }
    drag = null;

    if (captured) {
      if (piece === "buddy") faceTheMiddle();
      await savePositions();
    }

    // The click that ends a drag arrives right after pointerup.
    setTimeout(() => {
      movedDuringPointer = false;
    }, 80);
  }

  /* Keep a piece on screen; place it the first time it shows. */
  function clampAndApply(piece) {
    const node = pieceNode(piece);
    if (!node || node.hidden) return;

    const rect = node.getBoundingClientRect();
    const width = rect.width || (piece === "timer" ? 230 : 268);
    const height = rect.height || (piece === "timer" ? 66 : 260);
    const pad = 10;

    if (!positions[piece]) {
      // The timer up in the top-right corner, the cat in the bottom-right.
      positions[piece] = piece === "timer"
        ? { x: window.innerWidth - width - 24, y: 96 }
        : { x: window.innerWidth - width - 24, y: window.innerHeight - height - 24 };
    }

    const position = positions[piece];
    position.x = Math.min(Math.max(pad, position.x), Math.max(pad, window.innerWidth - width - pad));
    position.y = Math.min(Math.max(pad, position.y), Math.max(pad, window.innerHeight - height - pad));

    node.style.left = `${Math.round(position.x)}px`;
    node.style.top = `${Math.round(position.y)}px`;
  }

  async function savePositions() {
    try {
      const data = {};
      if (positions.timer) data[TIMER_POSITION_KEY] = positions.timer;
      if (positions.buddy) data[BUDDY_POSITION_KEY] = positions.buddy;
      await chrome.storage.local.set(data);
    } catch (error) {
      // Ignore storage errors in restricted contexts.
    }
  }

  async function loadPositions() {
    try {
      const data = await chrome.storage.local.get([TIMER_POSITION_KEY, BUDDY_POSITION_KEY]);
      positions.timer = data[TIMER_POSITION_KEY] || null;
      positions.buddy = data[BUDDY_POSITION_KEY] || null;
    } catch (error) {
      positions.timer = null;
      positions.buddy = null;
    }
  }

  /* ---------- Fireflies inside the timer card ---------- */

  const FIREFLY_PALETTE = {
    midnight: {
      work: { core: "rgba(255, 230, 250, 1)", halo: "rgba(212, 95, 206, .64)", glow: "rgba(178, 50, 175, .72)" },
      shortBreak: { core: "rgba(214, 250, 255, 1)", halo: "rgba(79, 201, 224, .62)", glow: "rgba(40, 170, 196, .70)" },
      longBreak: { core: "rgba(232, 228, 255, 1)", halo: "rgba(154, 140, 242, .62)", glow: "rgba(116, 100, 224, .70)" }
    },
    daylight: {
      work: { core: "rgba(184, 74, 92, 1)", halo: "rgba(154, 54, 72, .55)", glow: "rgba(184, 74, 92, .48)" },
      shortBreak: { core: "rgba(60, 99, 200, 1)", halo: "rgba(44, 76, 168, .55)", glow: "rgba(60, 99, 200, .48)" },
      longBreak: { core: "rgba(147, 51, 165, 1)", halo: "rgba(118, 36, 134, .55)", glow: "rgba(147, 51, 165, .48)" }
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
    const waypoint = () => `${rnd(-26, 26).toFixed(1)}px`;

    firefly.style.setProperty("--fx", `${rnd(6, 94).toFixed(2)}%`);
    firefly.style.setProperty("--fy", `${rnd(10, 90).toFixed(2)}%`);
    firefly.style.setProperty("--size", `${rnd(3, 5.5).toFixed(1)}px`);

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
    return state?.running ? 9 : 6;
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
      !dismissed.timer &&
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

  /* ---------- Render ---------- */

  function label(node, text) {
    node.title = text;
    node.setAttribute("aria-label", text);
  }

  function renderTasks(dictionary) {
    const open = (state.tasks || []).filter((task) => !task.done);
    const shown = open.slice(0, MAX_TASKS);

    /*
     * Rebuild only when a task actually changed. The widget re-renders twice a
     * second; without this guard the native date picker would be torn out of
     * the DOM and snap shut while the user is still choosing a day.
     */
    const signature = [
      getLanguage(),
      new Date().toDateString(),
      open.length,
      shown
        .map((task) => `${task.id}~${task.text}~${task.done ? 1 : 0}~${task.deadline || ""}`)
        .join("|")
    ].join("##");

    if (signature === tasksSignature) return;
    tasksSignature = signature;
    nodes.tasksList.replaceChildren();

    if (!shown.length) {
      const empty = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "empty";
      button.textContent = dictionary.noTasks;
      empty.appendChild(button);
      nodes.tasksList.appendChild(empty);
    }

    for (const task of shown) {
      const li = document.createElement("li");
      li.className = "task";
      const urgency = deadlineUrgency(task.deadline, task.done);
      if (urgency) li.classList.add(urgency);
      if (task.deadline) li.classList.add("has-deadline");
      li.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", task.text);

      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;
      text.title = task.text;

      const deadline = document.createElement("input");
      deadline.type = "date";
      deadline.className = "task-deadline";
      deadline.value = task.deadline || "";
      deadline.title = task.deadline ? dictionary.deadlineTitle : dictionary.addDeadlineTitle;
      if (urgency) deadline.classList.add(urgency);
      if (!task.deadline) deadline.classList.add("is-empty");

      const body = document.createElement("div");
      body.className = "task-body";
      body.append(text, deadline);

      li.append(checkbox, body);
      nodes.tasksList.appendChild(li);
    }

    const rest = open.length - shown.length;
    nodes.more.hidden = rest <= 0;
    nodes.more.textContent = rest > 0 ? dictionary.more.replace("{n}", rest) : "";
  }

  function render() {
    if (!state || !nodes.fw) return;

    const settings = state.settings || {};
    const dictionary = t();
    const enabled = settings.floatingWidgetEnabled !== false;
    const showTimer = enabled && !dismissed.timer;
    const showCompanion = enabled && !dismissed.buddy;

    host.style.display = showTimer || showCompanion ? "block" : "none";
    nodes.timer.hidden = !showTimer;
    nodes.companion.hidden = !showCompanion;

    nodes.fw.dataset.theme = settings.theme || "midnight";
    nodes.fw.dataset.mode = state.mode;
    nodes.fw.dataset.running = String(Boolean(state.running));
    nodes.fw.style.setProperty("--text-scale", String(getTextScale()));

    // ---- the timer
    const duration = getDurationMs(state.mode, settings);
    const remaining = getRemainingMs();
    const progress = Math.min(100, Math.max(0, 100 - (remaining / duration) * 100));
    nodes.ring.style.setProperty("--progress", `${progress * 3.6}deg`);
    nodes.time.textContent = formatTime(remaining);
    nodes.mode.textContent = getModeLabel(state.mode);
    label(nodes.ring, dictionary.openHint);
    nodes.readout.title = dictionary.openHint;
    label(nodes.startBtn, dictionary.start);
    label(nodes.pauseBtn, dictionary.pause);
    nodes.startBtn.disabled = state.running;
    nodes.pauseBtn.disabled = !state.running;
    label(nodes.hideTimer, dictionary.closeTitle);

    // ---- the cat, its toolbar and the tasks
    const folded = settings.floatingWidgetCompact === true;
    const catOn = showCompanion && settings.studyBuddyEnabled !== false;
    syncBuddy(catOn);
    nodes.companion.dataset.folded = String(folded);
    nodes.pill.setAttribute("aria-label", dictionary.catToolbar);
    label(nodes.addBtn, dictionary.addTaskAria);
    nodes.addBtn.setAttribute("aria-pressed", String(formOpen && !folded));
    label(nodes.purrBtn, dictionary.purr);
    nodes.purrBtn.disabled = !catOn || !buddy;
    nodes.purrBtn.setAttribute("aria-pressed", String(Boolean(buddy?.isPurring())));
    label(nodes.foldBtn, folded ? dictionary.expandTitle : dictionary.collapseTitle);
    nodes.foldBtn.setAttribute("aria-expanded", String(!folded));
    label(nodes.hideBuddy, dictionary.closeTitle);
    nodes.taskCard.setAttribute("aria-label", dictionary.tasks);
    nodes.taskForm.hidden = !formOpen;
    nodes.taskInput.placeholder = dictionary.taskPlaceholder;
    label(nodes.taskAddBtn, dictionary.addTaskAria);
    if (!folded) renderTasks(dictionary);

    clampAndApply("timer");
    clampAndApply("buddy");
    syncFireflyTimer();
  }

  async function loadState() {
    const response = await safeSend("GET_STATE");
    if (response.ok) {
      state = response.state;
      render();
    }
  }

  /* Every tick first checks the extension is still there — see extensionAlive(). */
  function tick() {
    if (!extensionAlive()) {
      teardown();
      return;
    }
    render();
  }

  async function init() {
    if (!extensionAlive()) return;

    createWidget();
    await loadPositions();
    await loadState();
    if (tornDown) return;

    try {
      chrome.storage.onChanged.addListener(onStorageChanged);
    } catch (error) {
      // Extension context may be invalidated during reload.
    }

    renderTimer = setInterval(tick, 500);
  }

  init();
})();
