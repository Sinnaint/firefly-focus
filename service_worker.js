const END_ALARM = "pomodoro-end-alarm";
const WARNING_ALARM = "pomodoro-warning-alarm";

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLong: 4,
  remindBeforeEndSeconds: 60,
  dailyGoalSessions: 8,
  soundTheme: "bright",
  autoContinue: true,
  notificationsEnabled: true,
  soundEnabled: true,
  language: "uk",
  theme: "midnight",
  textScale: 100,
  widgetMode: "full",
  floatingWidgetEnabled: true,
  fireflyAnimationEnabled: true,
  fireflyIntervalValue: 10,
  fireflyIntervalUnit: "seconds",
  fireflyIntervalMinutes: 5
};

const DEFAULT_STATS = {
  date: getTodayKey(),
  sessionsToday: 0,
  focusMsToday: 0,
  totalSessions: 0,
  totalFocusMs: 0
};

const DEFAULT_STATE = {
  mode: "work",
  running: false,
  endsAt: null,
  remainingMs: null,
  sessionsDone: 0,
  settings: DEFAULT_SETTINGS,
  tasks: [],
  stats: DEFAULT_STATS
};

const messages = {
  uk: {
    modes: {
      work: "Робота",
      shortBreak: "Коротка перерва",
      longBreak: "Довга перерва"
    },
    badgeFocus: "ФОК",
    badgeBreak: "ПЕР",
    startWorkTitle: "Старт роботи",
    startWorkMessage: "Фокус-сесія почалась. Обери одну задачу й тримай темп.",
    startBreakTitle: "Старт перерви",
    startBreakMessage: (mode) => `${mode} почалась. Час відновитись.`,
    pauseTitle: "Пауза",
    pauseMessage: (minutes) => `Таймер зупинено. Залишилось приблизно: ${minutes} хв.`,
    warningTitle: "Скоро зміна режиму",
    warningMessage: (phrase, mode) => `Залишилось приблизно ${phrase}: ${mode} майже завершено.`,
    focusDoneTitle: "Фокус завершено",
    focusDoneRunning: (mode) => `${mode} почалась. Встань, розімнись і відпочинь.`,
    focusDoneReady: (mode) => `${mode} готова. Натисни «Старт», коли будеш готовий.`,
    breakDoneTitle: "Перерва завершилась",
    breakDoneRunning: "Час повернутися до фокусу.",
    breakDoneReady: "Робочий етап готовий. Натисни «Старт», коли будеш готовий.",
    skippedTitle: "Етап пропущено",
    skippedMessage: (mode) => `${mode} почалась.`,
    minutesShort: "хв.",
    secondsShort: "сек."
  },
  en: {
    modes: {
      work: "Focus",
      shortBreak: "Short break",
      longBreak: "Long break"
    },
    badgeFocus: "FOC",
    badgeBreak: "BRK",
    startWorkTitle: "Focus started",
    startWorkMessage: "Your focus session has started. Pick one task and keep the pace.",
    startBreakTitle: "Break started",
    startBreakMessage: (mode) => `${mode} has started. Time to recover.`,
    pauseTitle: "Paused",
    pauseMessage: (minutes) => `Timer paused. About ${minutes} min left.`,
    warningTitle: "Stage change soon",
    warningMessage: (phrase, mode) => `About ${phrase} left: ${mode} is almost done.`,
    focusDoneTitle: "Focus complete",
    focusDoneRunning: (mode) => `${mode} has started. Stand up, stretch and rest.`,
    focusDoneReady: (mode) => `${mode} is ready. Press Start when you are ready.`,
    breakDoneTitle: "Break complete",
    breakDoneRunning: "Time to return to focus.",
    breakDoneReady: "The focus stage is ready. Press Start when you are ready.",
    skippedTitle: "Stage skipped",
    skippedMessage: (mode) => `${mode} has started.`,
    minutesShort: "min",
    secondsShort: "sec"
  },
  de: {
    modes: {
      work: "Fokus",
      shortBreak: "Kurze Pause",
      longBreak: "Lange Pause"
    },
    badgeFocus: "FOK",
    badgeBreak: "PAU",
    startWorkTitle: "Fokus gestartet",
    startWorkMessage: "Deine Fokus-Sitzung hat begonnen. Wähle eine Aufgabe und halte das Tempo.",
    startBreakTitle: "Pause gestartet",
    startBreakMessage: (mode) => `${mode} hat begonnen. Zeit zum Erholen.`,
    pauseTitle: "Pausiert",
    pauseMessage: (minutes) => `Timer pausiert. Noch etwa ${minutes} Min.`,
    warningTitle: "Phasenwechsel bald",
    warningMessage: (phrase, mode) => `Noch etwa ${phrase}: ${mode} ist fast fertig.`,
    focusDoneTitle: "Fokus abgeschlossen",
    focusDoneRunning: (mode) => `${mode} hat begonnen. Steh auf, streck dich und ruh dich aus.`,
    focusDoneReady: (mode) => `${mode} ist bereit. Drücke „Start“, wenn du bereit bist.`,
    breakDoneTitle: "Pause beendet",
    breakDoneRunning: "Zeit, zum Fokus zurückzukehren.",
    breakDoneReady: "Die Fokusphase ist bereit. Drücke „Start“, wenn du bereit bist.",
    skippedTitle: "Phase übersprungen",
    skippedMessage: (mode) => `${mode} hat begonnen.`,
    minutesShort: "Min",
    secondsShort: "Sek"
  },
  es: {
    modes: {
      work: "Enfoque",
      shortBreak: "Descanso corto",
      longBreak: "Descanso largo"
    },
    badgeFocus: "ENF",
    badgeBreak: "DES",
    startWorkTitle: "Enfoque iniciado",
    startWorkMessage: "Tu sesión de enfoque ha comenzado. Elige una tarea y mantén el ritmo.",
    startBreakTitle: "Descanso iniciado",
    startBreakMessage: (mode) => `${mode} ha comenzado. Hora de recuperarse.`,
    pauseTitle: "En pausa",
    pauseMessage: (minutes) => `Temporizador en pausa. Quedan unos ${minutes} min.`,
    warningTitle: "Cambio de etapa pronto",
    warningMessage: (phrase, mode) => `Quedan unos ${phrase}: ${mode} está casi terminado.`,
    focusDoneTitle: "Enfoque completado",
    focusDoneRunning: (mode) => `${mode} ha comenzado. Levántate, estírate y descansa.`,
    focusDoneReady: (mode) => `${mode} está listo. Pulsa «Iniciar» cuando estés listo.`,
    breakDoneTitle: "Descanso completado",
    breakDoneRunning: "Hora de volver al enfoque.",
    breakDoneReady: "La etapa de enfoque está lista. Pulsa «Iniciar» cuando estés listo.",
    skippedTitle: "Etapa omitida",
    skippedMessage: (mode) => `${mode} ha comenzado.`,
    minutesShort: "min",
    secondsShort: "seg"
  },
  it: {
    modes: {
      work: "Concentrazione",
      shortBreak: "Pausa breve",
      longBreak: "Pausa lunga"
    },
    badgeFocus: "FOC",
    badgeBreak: "PAU",
    startWorkTitle: "Concentrazione avviata",
    startWorkMessage: "La tua sessione di concentrazione è iniziata. Scegli un'attività e mantieni il ritmo.",
    startBreakTitle: "Pausa avviata",
    startBreakMessage: (mode) => `Inizia: ${mode}. È ora di recuperare.`,
    pauseTitle: "In pausa",
    pauseMessage: (minutes) => `Timer in pausa. Restano circa ${minutes} min.`,
    warningTitle: "Cambio fase a breve",
    warningMessage: (phrase, mode) => `Restano circa ${phrase}: ${mode} sta per finire.`,
    focusDoneTitle: "Concentrazione completata",
    focusDoneRunning: (mode) => `Inizia: ${mode}. Alzati, allungati e riposa.`,
    focusDoneReady: (mode) => `${mode} è pronta. Premi «Avvia» quando sei pronto.`,
    breakDoneTitle: "Pausa terminata",
    breakDoneRunning: "È ora di tornare alla concentrazione.",
    breakDoneReady: "La fase di concentrazione è pronta. Premi «Avvia» quando sei pronto.",
    skippedTitle: "Fase saltata",
    skippedMessage: (mode) => `Inizia: ${mode}.`,
    minutesShort: "min",
    secondsShort: "sec"
  },
  sk: {
    modes: {
      work: "Sústredenie",
      shortBreak: "Krátka prestávka",
      longBreak: "Dlhá prestávka"
    },
    badgeFocus: "FOK",
    badgeBreak: "PRE",
    startWorkTitle: "Sústredenie spustené",
    startWorkMessage: "Tvoja relácia sústredenia sa začala. Vyber si jednu úlohu a udrž tempo.",
    startBreakTitle: "Prestávka spustená",
    startBreakMessage: (mode) => `Začína sa: ${mode}. Čas na oddych.`,
    pauseTitle: "Pozastavené",
    pauseMessage: (minutes) => `Časovač pozastavený. Zostáva približne ${minutes} min.`,
    warningTitle: "Čoskoro zmena fázy",
    warningMessage: (phrase, mode) => `Zostáva približne ${phrase}: ${mode} sa takmer skončí.`,
    focusDoneTitle: "Sústredenie dokončené",
    focusDoneRunning: (mode) => `Začína sa: ${mode}. Postav sa, ponaťahuj sa a oddýchni si.`,
    focusDoneReady: (mode) => `${mode} je pripravená. Stlač „Štart“, keď budeš pripravený.`,
    breakDoneTitle: "Prestávka skončila",
    breakDoneRunning: "Čas vrátiť sa k sústredeniu.",
    breakDoneReady: "Fáza sústredenia je pripravená. Stlač „Štart“, keď budeš pripravený.",
    skippedTitle: "Fáza preskočená",
    skippedMessage: (mode) => `Začína sa: ${mode}.`,
    minutesShort: "min",
    secondsShort: "s"
  },
  cs: {
    modes: {
      work: "Soustředění",
      shortBreak: "Krátká přestávka",
      longBreak: "Dlouhá přestávka"
    },
    badgeFocus: "FOK",
    badgeBreak: "PŘE",
    startWorkTitle: "Soustředění spuštěno",
    startWorkMessage: "Tvoje relace soustředění začala. Vyber si jeden úkol a udrž tempo.",
    startBreakTitle: "Přestávka spuštěna",
    startBreakMessage: (mode) => `Začíná: ${mode}. Čas na odpočinek.`,
    pauseTitle: "Pozastaveno",
    pauseMessage: (minutes) => `Časovač pozastaven. Zbývá přibližně ${minutes} min.`,
    warningTitle: "Brzy změna fáze",
    warningMessage: (phrase, mode) => `Zbývá přibližně ${phrase}: ${mode} se téměř dokončí.`,
    focusDoneTitle: "Soustředění dokončeno",
    focusDoneRunning: (mode) => `Začíná: ${mode}. Postav se, protáhni se a odpočiň si.`,
    focusDoneReady: (mode) => `${mode} je připravená. Stiskni „Start“, až budeš připraven.`,
    breakDoneTitle: "Přestávka skončila",
    breakDoneRunning: "Čas vrátit se k soustředění.",
    breakDoneReady: "Fáze soustředění je připravená. Stiskni „Start“, až budeš připraven.",
    skippedTitle: "Fáze přeskočena",
    skippedMessage: (mode) => `Začíná: ${mode}.`,
    minutesShort: "min",
    secondsShort: "s"
  }
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function normalizeSettings(settings = {}) {
  const themes = ["bright", "arcade", "bell", "soft"];
  const languages = ["uk", "en", "de", "es", "it", "sk", "cs"];
  const colorThemes = ["midnight", "daylight", "sage"];
  const widgetModes = ["full", "compact"];
  const fireflyIntervalUnits = ["seconds", "minutes"];
  const fireflyIntervalUnit = fireflyIntervalUnits.includes(settings.fireflyIntervalUnit)
    ? settings.fireflyIntervalUnit
    : "seconds";

  const fireflyIntervalFallback = fireflyIntervalUnit === "minutes" ? 5 : 10;

  const fireflyIntervalValue = clampNumber(
    settings.fireflyIntervalValue ?? settings.fireflyIntervalMinutes ?? fireflyIntervalFallback,
    fireflyIntervalUnit === "seconds" ? 3 : 1,
    fireflyIntervalUnit === "seconds" ? 300 : 60,
    fireflyIntervalFallback
  );

  return {
    workMinutes: clampNumber(settings.workMinutes, 1, 180, 25),
    shortBreakMinutes: clampNumber(settings.shortBreakMinutes, 1, 60, 5),
    longBreakMinutes: clampNumber(settings.longBreakMinutes, 1, 120, 15),
    cyclesBeforeLong: clampNumber(settings.cyclesBeforeLong, 1, 12, 4),
    remindBeforeEndSeconds: clampNumber(settings.remindBeforeEndSeconds, 0, 600, 60),
    dailyGoalSessions: clampNumber(settings.dailyGoalSessions, 1, 20, 8),
    soundTheme: themes.includes(settings.soundTheme) ? settings.soundTheme : "bright",
    autoContinue: settings.autoContinue !== false,
    notificationsEnabled: settings.notificationsEnabled !== false,
    soundEnabled: settings.soundEnabled !== false,
    language: languages.includes(settings.language) ? settings.language : "uk",
    theme: colorThemes.includes(settings.theme) ? settings.theme : "midnight",
    textScale: clampNumber(settings.textScale, 80, 140, 100),
    widgetMode: widgetModes.includes(settings.widgetMode) ? settings.widgetMode : "full",
    floatingWidgetEnabled: settings.floatingWidgetEnabled !== false,
    fireflyAnimationEnabled: settings.fireflyAnimationEnabled !== false,
    fireflyIntervalValue,
    fireflyIntervalUnit,
    fireflyIntervalMinutes: clampNumber(settings.fireflyIntervalMinutes, 1, 60, 5)
  };
}

function getLanguage(settings) {
  const lang = settings?.language;
  return messages[lang] ? lang : "uk";
}

function getMessages(settings) {
  return messages[getLanguage(settings)];
}

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeStats(stats = {}) {
  const today = getTodayKey();
  const normalized = {
    ...DEFAULT_STATS,
    ...stats
  };

  if (normalized.date !== today) {
    return {
      ...normalized,
      date: today,
      sessionsToday: 0,
      focusMsToday: 0
    };
  }

  return normalized;
}

function normalizeDeadline(value) {
  if (typeof value !== "string") return null;
  // Expect an ISO calendar date (YYYY-MM-DD) from <input type="date">.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .filter((task) => task && typeof task.text === "string")
    .slice(0, 30)
    .map((task) => ({
      id: String(task.id || crypto.randomUUID()),
      text: task.text.slice(0, 90),
      done: Boolean(task.done),
      deadline: normalizeDeadline(task.deadline)
    }));
}

async function getState() {
  const data = await chrome.storage.local.get("pomodoro");
  const saved = data.pomodoro || {};

  return {
    ...DEFAULT_STATE,
    ...saved,
    settings: normalizeSettings(saved.settings || DEFAULT_SETTINGS),
    tasks: normalizeTasks(saved.tasks),
    stats: normalizeStats(saved.stats)
  };
}

async function setState(nextState) {
  const normalizedState = {
    ...nextState,
    settings: normalizeSettings(nextState.settings),
    tasks: normalizeTasks(nextState.tasks),
    stats: normalizeStats(nextState.stats)
  };

  await chrome.storage.local.set({ pomodoro: normalizedState });
  await updateBadge(normalizedState);
  return normalizedState;
}

function getDurationMs(mode, settings) {
  if (mode === "work") return settings.workMinutes * 60 * 1000;
  if (mode === "longBreak") return settings.longBreakMinutes * 60 * 1000;
  return settings.shortBreakMinutes * 60 * 1000;
}

function modeLabel(mode, settings) {
  return getMessages(settings).modes[mode];
}

function nextModeAfter(state, countWorkSession) {
  if (state.mode !== "work") return "work";

  const sessionsCount = countWorkSession ? state.sessionsDone + 1 : state.sessionsDone;
  const shouldUseLongBreak = sessionsCount > 0 && sessionsCount % state.settings.cyclesBeforeLong === 0;
  return shouldUseLongBreak ? "longBreak" : "shortBreak";
}

async function updateBadge(state) {
  const msg = getMessages(state.settings);
  const text = state.running
    ? state.mode === "work"
      ? msg.badgeFocus
      : msg.badgeBreak
    : "";

  await chrome.action.setBadgeText({ text });
  // Deeper than the in-app accents so the badge stays legible on both the
  // light and dark Chrome toolbars (magenta focus / periwinkle rest).
  await chrome.action.setBadgeBackgroundColor({
    color: state.mode === "work" ? "#b23fb0" : "#2f74a8"
  });
}

async function notify(title, message) {
  const state = await getState();
  if (!state.settings.notificationsEnabled) return;

  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icon128.png",
    title,
    message
  });
}

async function clearTimerAlarms() {
  await chrome.alarms.clear(END_ALARM);
  await chrome.alarms.clear(WARNING_ALARM);
}

async function scheduleTimerAlarms(state) {
  await clearTimerAlarms();

  if (!state.running || !state.endsAt) return;

  await chrome.alarms.create(END_ALARM, {
    when: state.endsAt
  });

  const warningAt = state.endsAt - state.settings.remindBeforeEndSeconds * 1000;

  if (state.settings.remindBeforeEndSeconds > 0 && warningAt > Date.now() + 500) {
    await chrome.alarms.create(WARNING_ALARM, {
      when: warningAt
    });
  }
}

let creatingOffscreenDocument;

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) return false;

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("offscreen.html")]
  });

  if (existingContexts.length > 0) return true;

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return true;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play Pomodoro start, stop and reminder sounds."
  });

  await creatingOffscreenDocument;
  creatingOffscreenDocument = null;
  return true;
}

async function closeOffscreenDocument() {
  if (!chrome.offscreen) return;

  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL("offscreen.html")]
    });

    if (contexts.length > 0) {
      await chrome.offscreen.closeDocument();
    }
  } catch (error) {
    // The document may already be closing; nothing to do.
  }
}

async function playSignal(kind) {
  const state = await getState();
  if (!state.settings.soundEnabled) return;

  const ok = await ensureOffscreenDocument();
  if (!ok) return;

  chrome.runtime.sendMessage({
    target: "offscreen",
    type: "PLAY_SIGNAL",
    kind,
    theme: state.settings.soundTheme
  });
}

async function configureSidePanel() {
  if (!chrome.sidePanel) return;

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
}


async function openFullSidePanel(sender) {
  if (!chrome.sidePanel?.open) return false;

  const tab = sender?.tab;

  try {
    if (typeof tab?.windowId === "number") {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      return true;
    }

    if (typeof tab?.id === "number") {
      await chrome.sidePanel.open({ tabId: tab.id });
      return true;
    }
  } catch (error) {
    console.warn("Could not open side panel:", error);
  }

  return false;
}

async function startTimer() {
  const state = await getState();
  const msg = getMessages(state.settings);
  const duration = state.remainingMs ?? getDurationMs(state.mode, state.settings);

  const nextState = await setState({
    ...state,
    running: true,
    endsAt: Date.now() + duration,
    remainingMs: null
  });

  await scheduleTimerAlarms(nextState);

  if (nextState.mode === "work") {
    await notify(msg.startWorkTitle, msg.startWorkMessage);
    await playSignal("startWork");
  } else {
    await notify(msg.startBreakTitle, msg.startBreakMessage(modeLabel(nextState.mode, nextState.settings)));
    await playSignal("startBreak");
  }

  return nextState;
}

async function pauseTimer() {
  const state = await getState();
  const msg = getMessages(state.settings);
  const duration = getDurationMs(state.mode, state.settings);

  const remainingMs = state.running
    ? Math.max(0, state.endsAt - Date.now())
    : state.remainingMs ?? duration;

  const nextState = await setState({
    ...state,
    running: false,
    endsAt: null,
    remainingMs
  });

  await clearTimerAlarms();
  await notify(msg.pauseTitle, msg.pauseMessage(Math.ceil(remainingMs / 60000)));
  await playSignal("pause");

  return nextState;
}

async function resetTimer() {
  const state = await getState();

  const nextState = await setState({
    ...state,
    mode: "work",
    running: false,
    endsAt: null,
    remainingMs: null
  });

  await clearTimerAlarms();
  await playSignal("reset");

  return nextState;
}

async function resetStats() {
  const state = await getState();

  return setState({
    ...state,
    stats: {
      ...DEFAULT_STATS,
      date: getTodayKey()
    }
  });
}

async function saveSettings(settings) {
  const state = await getState();
  const normalizedSettings = normalizeSettings(settings);

  let nextState = {
    ...state,
    settings: normalizedSettings
  };

  if (!nextState.running) {
    nextState.remainingMs = null;
  }

  nextState = await setState(nextState);

  if (nextState.running) {
    await scheduleTimerAlarms(nextState);
  }

  return nextState;
}

async function handleWarningAlarm() {
  const state = await getState();
  if (!state.running) return state;

  const msg = getMessages(state.settings);
  const seconds = state.settings.remindBeforeEndSeconds;
  const phrase = seconds >= 60
    ? `${Math.round(seconds / 60)} ${msg.minutesShort}`
    : `${seconds} ${msg.secondsShort}`;

  await notify(msg.warningTitle, msg.warningMessage(phrase, modeLabel(state.mode, state.settings)));
  await playSignal("warning");

  return state;
}

async function completeCycle() {
  const state = await getState();

  if (!state.running) return state;

  const msg = getMessages(state.settings);
  let sessionsDone = state.sessionsDone;
  let stats = normalizeStats(state.stats);
  let nextMode;
  let title;
  let message;
  let signal;

  if (state.mode === "work") {
    sessionsDone += 1;
    stats = {
      ...stats,
      sessionsToday: stats.sessionsToday + 1,
      focusMsToday: stats.focusMsToday + getDurationMs("work", state.settings),
      totalSessions: stats.totalSessions + 1,
      totalFocusMs: stats.totalFocusMs + getDurationMs("work", state.settings)
    };

    nextMode = nextModeAfter({ ...state, sessionsDone }, false);
    title = msg.focusDoneTitle;
    signal = "finishWork";
  } else {
    nextMode = "work";
    title = msg.breakDoneTitle;
    signal = "startWork";
  }

  const shouldRunNext = state.settings.autoContinue;
  const nextDuration = getDurationMs(nextMode, state.settings);

  if (state.mode === "work") {
    message = shouldRunNext
      ? msg.focusDoneRunning(modeLabel(nextMode, state.settings))
      : msg.focusDoneReady(modeLabel(nextMode, state.settings));
  } else {
    message = shouldRunNext ? msg.breakDoneRunning : msg.breakDoneReady;
  }

  const nextState = await setState({
    ...state,
    mode: nextMode,
    running: shouldRunNext,
    endsAt: shouldRunNext ? Date.now() + nextDuration : null,
    remainingMs: shouldRunNext ? null : nextDuration,
    sessionsDone,
    stats
  });

  if (shouldRunNext) {
    await scheduleTimerAlarms(nextState);
  } else {
    await clearTimerAlarms();
  }

  await notify(title, message);
  await playSignal(signal);

  return nextState;
}

async function skipStage() {
  const state = await getState();
  const msg = getMessages(state.settings);
  const nextMode = nextModeAfter(state, false);
  const duration = getDurationMs(nextMode, state.settings);

  const nextState = await setState({
    ...state,
    mode: nextMode,
    running: true,
    endsAt: Date.now() + duration,
    remainingMs: null
  });

  await scheduleTimerAlarms(nextState);
  await notify(msg.skippedTitle, msg.skippedMessage(modeLabel(nextMode, nextState.settings)));
  await playSignal(nextMode === "work" ? "startWork" : "startBreak");

  return nextState;
}

async function addTask(text, deadline) {
  const state = await getState();
  const cleanText = String(text || "").trim().slice(0, 90);

  if (!cleanText) return state;

  return setState({
    ...state,
    tasks: [
      ...state.tasks,
      {
        id: crypto.randomUUID(),
        text: cleanText,
        done: false,
        deadline: normalizeDeadline(deadline)
      }
    ]
  });
}

async function setTaskDeadline(id, deadline) {
  const state = await getState();
  const normalized = normalizeDeadline(deadline);

  return setState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, deadline: normalized } : task
    )
  });
}

async function toggleTask(id) {
  const state = await getState();

  return setState({
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, done: !task.done } : task
    )
  });
}

async function deleteTask(id) {
  const state = await getState();

  return setState({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== id)
  });
}

async function clearDoneTasks() {
  const state = await getState();

  return setState({
    ...state,
    tasks: state.tasks.filter((task) => !task.done)
  });
}

async function restoreAlarmIfNeeded() {
  await configureSidePanel();

  const state = await getState();

  if (!state.running || !state.endsAt) {
    await clearTimerAlarms();
    await updateBadge(state);
    return;
  }

  if (state.endsAt <= Date.now()) {
    await completeCycle();
    return;
  }

  await scheduleTimerAlarms(state);
  await updateBadge(state);
}

chrome.runtime.onInstalled.addListener(async () => {
  await configureSidePanel();
  const current = await getState();
  await setState(current);
  await restoreAlarmIfNeeded();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
  restoreAlarmIfNeeded();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === END_ALARM) {
    completeCycle();
  }

  if (alarm.name === WARNING_ALARM) {
    handleWarningAlarm();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLOSE_OFFSCREEN") {
    closeOffscreenDocument();
    return;
  }

  (async () => {
    let state;

    switch (message.type) {
      case "GET_STATE":
        state = await getState();
        break;
      case "START":
        state = await startTimer();
        break;
      case "PAUSE":
        state = await pauseTimer();
        break;
      case "SKIP_STAGE":
        state = await skipStage();
        break;
      case "RESET_TIMER":
        state = await resetTimer();
        break;
      case "RESET_STATS":
        state = await resetStats();
        break;
      case "SAVE_SETTINGS":
        state = await saveSettings(message.settings);
        break;
      case "ADD_TASK":
        state = await addTask(message.text, message.deadline);
        break;
      case "SET_TASK_DEADLINE":
        state = await setTaskDeadline(message.id, message.deadline);
        break;
      case "TOGGLE_TASK":
        state = await toggleTask(message.id);
        break;
      case "DELETE_TASK":
        state = await deleteTask(message.id);
        break;
      case "CLEAR_DONE_TASKS":
        state = await clearDoneTasks();
        break;
      case "OPEN_SIDE_PANEL":
        await openFullSidePanel(sender);
        state = await getState();
        break;
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }

    sendResponse({ ok: true, state });
  })().catch((error) => {
    console.error(error);
    sendResponse({
      ok: false,
      error: error.message
    });
  });

  return true;
});

configureSidePanel();
restoreAlarmIfNeeded();
