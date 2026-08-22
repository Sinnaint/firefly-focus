/*
 * Shared data for the extension's own pages (side panel + fullscreen).
 * The floating widget is a content script with its own trimmed dictionary —
 * it deliberately does not load this file.
 */

const i18n = {
  uk: {
    eyebrow: "Боковий віджет",
    title: "Фокус Pomodoro",
    modes: {
      work: "Робота",
      shortBreak: "Коротка перерва",
      longBreak: "Довга перерва"
    },
    hints: {
      work: "Зосередься на одній задачі. Усе зайве — після сигналу.",
      shortBreak: "Встань, випий води, розімни очі та плечі.",
      longBreak: "Довша пауза: рух, свіже повітря або чай."
    },
    idleHint: "Натисни «Старт», щоб почати або продовжити.",
    runningSubtitle: "Віджет залишається відкритим у side panel під час переходу між вкладками.",
    idleSubtitle: "Спокійний таймер для фокусу, перерв і задач.",
    start: "Старт",
    pause: "Пауза",
    nextStage: "Наступний етап",
    reset: "Скинути",
    compact: "Менший",
    full: "Повний",
    sessionsTodayLabel: "Сьогодні",
    sessionsSmall: "сесій",
    focusTimeLabel: "Фокус",
    focusSmall: "час",
    goalLabel: "Ціль",
    goalSmall: "сесій",
    tasksTitle: "Задачі",
    clearDone: "Очистити виконані",
    taskPlaceholder: "Додай одну фокус-задачу...",
    emptyTask: "Поки задач немає. Додай одну головну задачу на наступний Pomodoro.",
    markDoneTitle: "Позначити виконаною",
    deleteTaskTitle: "Видалити задачу",
    settingsTitle: "Налаштування",
    resetStats: "Скинути статистику",
    workMinutesLabel: "Робота, хв",
    shortBreakLabel: "Перерва, хв",
    longBreakLabel: "Довга перерва, хв",
    cyclesBeforeLongLabel: "Довга перерва кожні",
    reminderLabel: "Попередження за, сек",
    dailyGoalLabel: "Ціль сесій/день",
    textSizeLabel: "Розмір тексту, %",
    soundStyleLabel: "Стиль звуку",
    soundBright: "Bright clean",
    soundArcade: "Arcade",
    soundBell: "Bell",
    soundSoft: "Soft",
    autoContinueLabel: "Автоматично запускати наступний етап",
    notificationsLabel: "Системні нагадування",
    soundsLabel: "Звукові сигнали",
    floatingWidgetLabel: "Плаваючий віджет поверх сайтів",
    floatingWidgetQuick: "Плаваючий віджет на сайтах",
    widgetStateOn: "Увімк.",
    widgetStateOff: "Вимк.",
    fireflyAnimationLabel: "Анімація світлячків під час фокусу",
    fireflyIntervalLabel: "Світлячки кожні",
    fireflyUnitSeconds: "Секунди",
    fireflyUnitMinutes: "Хвилини",
    themeLabel: "Тема оформлення",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Додати дедлайн",
    deadlineTitle: "Дедлайн задачі",
    saveSettings: "Зберегти налаштування",
    minShort: "хв",
    addTaskAria: "Додати задачу",
    fullscreen: "На весь екран",
    fullscreenTitle: "Відкрити таймер на весь екран",
    enterFullscreen: "Розгорнути на весь екран",
    exitFullscreen: "Вийти з повного екрана",
    close: "Закрити",
    sessionsToday: "сесій сьогодні",
    focusToday: "фокусу сьогодні",
    noTaskYet: "Задачу не обрано",
    openPanel: "Відкрити повну панель із задачами",
    fullscreenTasksLabel: "Показувати задачі в повноекранному режимі",
    timerPresetLabel: "Ритм таймера",
    presetClassic: "Класичний · 25/5",
    presetDeep: "Глибока робота · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ультрадіанний · 90/20",
    presetSprint: "Короткі підходи · 15/3",
    presetCustom: "Власний",
    timerFaceLabel: "Вигляд таймера",
    faceRing: "Кільце",
    faceDigits: "Тільки цифри",
    faceBreathe: "Дихальне коло",
    studyBuddyLabel: "Капібара-компаньйон у костюмі світлячка",
    tasksDrag: "Перетягни"
  },
  en: {
    eyebrow: "Side panel widget",
    title: "Pomodoro Focus",
    modes: {
      work: "Focus",
      shortBreak: "Short break",
      longBreak: "Long break"
    },
    hints: {
      work: "Focus on one task. Everything else can wait until the signal.",
      shortBreak: "Stand up, drink water and relax your eyes and shoulders.",
      longBreak: "A longer pause: move, get fresh air or make tea."
    },
    idleHint: "Press Start to begin or continue.",
    runningSubtitle: "The widget stays open in the side panel while you switch tabs.",
    idleSubtitle: "A calm timer for focus, breaks and tasks.",
    start: "Start",
    pause: "Pause",
    nextStage: "Next stage",
    reset: "Reset",
    compact: "Compact",
    full: "Full",
    sessionsTodayLabel: "Today",
    sessionsSmall: "sessions",
    focusTimeLabel: "Focus",
    focusSmall: "time",
    goalLabel: "Goal",
    goalSmall: "sessions",
    tasksTitle: "Tasks",
    clearDone: "Clear done",
    taskPlaceholder: "Add one focus task...",
    emptyTask: "No tasks yet. Add one main task for the next Pomodoro.",
    markDoneTitle: "Mark as done",
    deleteTaskTitle: "Delete task",
    settingsTitle: "Settings",
    resetStats: "Reset stats",
    workMinutesLabel: "Work, min",
    shortBreakLabel: "Break, min",
    longBreakLabel: "Long break, min",
    cyclesBeforeLongLabel: "Long break every",
    reminderLabel: "Reminder before end, sec",
    dailyGoalLabel: "Daily goal",
    textSizeLabel: "Text size, %",
    soundStyleLabel: "Sound style",
    soundBright: "Bright clean",
    soundArcade: "Arcade",
    soundBell: "Bell",
    soundSoft: "Soft",
    autoContinueLabel: "Automatically start the next stage",
    notificationsLabel: "System notifications",
    soundsLabel: "Sound signals",
    floatingWidgetLabel: "Floating widget on websites",
    floatingWidgetQuick: "Floating widget on sites",
    widgetStateOn: "On",
    widgetStateOff: "Off",
    fireflyAnimationLabel: "Firefly animation during focus",
    fireflyIntervalLabel: "Fireflies every",
    fireflyUnitSeconds: "Seconds",
    fireflyUnitMinutes: "Minutes",
    themeLabel: "Theme",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Add deadline",
    deadlineTitle: "Task deadline",
    saveSettings: "Save settings",
    minShort: "min",
    addTaskAria: "Add task",
    fullscreen: "Fullscreen",
    fullscreenTitle: "Open the timer fullscreen",
    enterFullscreen: "Enter fullscreen",
    exitFullscreen: "Exit fullscreen",
    close: "Close",
    sessionsToday: "sessions today",
    focusToday: "focused today",
    noTaskYet: "No task picked",
    openPanel: "Open the full panel with tasks",
    fullscreenTasksLabel: "Show tasks in fullscreen mode",
    timerPresetLabel: "Timer rhythm",
    presetClassic: "Classic · 25/5",
    presetDeep: "Deep work · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradian · 90/20",
    presetSprint: "Short sprints · 15/3",
    presetCustom: "Custom",
    timerFaceLabel: "Timer face",
    faceRing: "Ring",
    faceDigits: "Digits only",
    faceBreathe: "Breathing circle",
    studyBuddyLabel: "Capybara study buddy in a firefly costume",
    tasksDrag: "Drag"
  },
  de: {
    eyebrow: "Seitenleisten-Widget",
    title: "Pomodoro Fokus",
    modes: { work: "Fokus", shortBreak: "Kurze Pause", longBreak: "Lange Pause" },
    hints: {
      work: "Konzentriere dich auf eine Aufgabe. Alles andere kann bis zum Signal warten.",
      shortBreak: "Steh auf, trink Wasser und entspanne Augen und Schultern.",
      longBreak: "Eine längere Pause: beweg dich, frische Luft oder ein Tee."
    },
    idleHint: "Drücke „Start“, um zu beginnen oder fortzufahren.",
    runningSubtitle: "Das Widget bleibt in der Seitenleiste offen, während du Tabs wechselst.",
    idleSubtitle: "Ein ruhiger Timer für Fokus, Pausen und Aufgaben.",
    start: "Start",
    pause: "Pause",
    nextStage: "Nächste Phase",
    reset: "Zurücksetzen",
    compact: "Kompakt",
    full: "Voll",
    sessionsTodayLabel: "Heute",
    sessionsSmall: "Sitzungen",
    focusTimeLabel: "Fokus",
    focusSmall: "Zeit",
    goalLabel: "Ziel",
    goalSmall: "Sitzungen",
    tasksTitle: "Aufgaben",
    clearDone: "Erledigte löschen",
    taskPlaceholder: "Eine Fokus-Aufgabe hinzufügen…",
    emptyTask: "Noch keine Aufgaben. Füge eine Hauptaufgabe für den nächsten Pomodoro hinzu.",
    markDoneTitle: "Als erledigt markieren",
    deleteTaskTitle: "Aufgabe löschen",
    settingsTitle: "Einstellungen",
    resetStats: "Statistik zurücksetzen",
    workMinutesLabel: "Arbeit, Min",
    shortBreakLabel: "Pause, Min",
    longBreakLabel: "Lange Pause, Min",
    cyclesBeforeLongLabel: "Lange Pause alle",
    reminderLabel: "Erinnerung vor Ende, Sek",
    dailyGoalLabel: "Tagesziel",
    textSizeLabel: "Textgröße, %",
    soundStyleLabel: "Klangstil",
    soundBright: "Hell & klar",
    soundArcade: "Arcade",
    soundBell: "Glocke",
    soundSoft: "Sanft",
    autoContinueLabel: "Nächste Phase automatisch starten",
    notificationsLabel: "Systembenachrichtigungen",
    soundsLabel: "Tonsignale",
    floatingWidgetLabel: "Schwebendes Widget auf Webseiten",
    floatingWidgetQuick: "Schwebendes Widget auf Seiten",
    widgetStateOn: "An",
    widgetStateOff: "Aus",
    fireflyAnimationLabel: "Glühwürmchen-Animation beim Fokus",
    fireflyIntervalLabel: "Glühwürmchen alle",
    fireflyUnitSeconds: "Sekunden",
    fireflyUnitMinutes: "Minuten",
    themeLabel: "Design",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Frist hinzufügen",
    deadlineTitle: "Aufgabenfrist",
    saveSettings: "Einstellungen speichern",
    minShort: "Min",
    addTaskAria: "Aufgabe hinzufügen",
    fullscreen: "Vollbild",
    fullscreenTitle: "Timer im Vollbild öffnen",
    enterFullscreen: "Vollbild starten",
    exitFullscreen: "Vollbild beenden",
    close: "Schließen",
    sessionsToday: "Sitzungen heute",
    focusToday: "Fokus heute",
    noTaskYet: "Keine Aufgabe gewählt",
    openPanel: "Volles Panel mit Aufgaben öffnen",
    fullscreenTasksLabel: "Aufgaben im Vollbild anzeigen",
    timerPresetLabel: "Timer-Rhythmus",
    presetClassic: "Klassisch · 25/5",
    presetDeep: "Deep Work · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradian · 90/20",
    presetSprint: "Kurze Sprints · 15/3",
    presetCustom: "Eigen",
    timerFaceLabel: "Timer-Darstellung",
    faceRing: "Ring",
    faceDigits: "Nur Ziffern",
    faceBreathe: "Atmender Kreis",
    studyBuddyLabel: "Capybara-Lernbegleiter im Glühwürmchen-Kostüm",
    tasksDrag: "Ziehen"
  },
  es: {
    eyebrow: "Widget del panel lateral",
    title: "Pomodoro Focus",
    modes: { work: "Enfoque", shortBreak: "Descanso corto", longBreak: "Descanso largo" },
    hints: {
      work: "Concéntrate en una tarea. Todo lo demás puede esperar a la señal.",
      shortBreak: "Levántate, bebe agua y relaja los ojos y los hombros.",
      longBreak: "Una pausa más larga: muévete, toma aire fresco o un té."
    },
    idleHint: "Pulsa «Iniciar» para empezar o continuar.",
    runningSubtitle: "El widget permanece abierto en el panel lateral mientras cambias de pestaña.",
    idleSubtitle: "Un temporizador tranquilo para enfoque, descansos y tareas.",
    start: "Iniciar",
    pause: "Pausa",
    nextStage: "Siguiente etapa",
    reset: "Reiniciar",
    compact: "Compacto",
    full: "Completo",
    sessionsTodayLabel: "Hoy",
    sessionsSmall: "sesiones",
    focusTimeLabel: "Enfoque",
    focusSmall: "tiempo",
    goalLabel: "Meta",
    goalSmall: "sesiones",
    tasksTitle: "Tareas",
    clearDone: "Borrar completadas",
    taskPlaceholder: "Añade una tarea de enfoque…",
    emptyTask: "Aún no hay tareas. Añade una tarea principal para el próximo Pomodoro.",
    markDoneTitle: "Marcar como hecha",
    deleteTaskTitle: "Eliminar tarea",
    settingsTitle: "Ajustes",
    resetStats: "Restablecer estadísticas",
    workMinutesLabel: "Trabajo, min",
    shortBreakLabel: "Descanso, min",
    longBreakLabel: "Descanso largo, min",
    cyclesBeforeLongLabel: "Descanso largo cada",
    reminderLabel: "Aviso antes del final, seg",
    dailyGoalLabel: "Meta diaria",
    textSizeLabel: "Tamaño del texto, %",
    soundStyleLabel: "Estilo de sonido",
    soundBright: "Brillante y limpio",
    soundArcade: "Arcade",
    soundBell: "Campana",
    soundSoft: "Suave",
    autoContinueLabel: "Iniciar automáticamente la siguiente etapa",
    notificationsLabel: "Notificaciones del sistema",
    soundsLabel: "Señales de sonido",
    floatingWidgetLabel: "Widget flotante en los sitios web",
    floatingWidgetQuick: "Widget flotante en sitios",
    widgetStateOn: "Activado",
    widgetStateOff: "Desactivado",
    fireflyAnimationLabel: "Animación de luciérnagas durante el enfoque",
    fireflyIntervalLabel: "Luciérnagas cada",
    fireflyUnitSeconds: "Segundos",
    fireflyUnitMinutes: "Minutos",
    themeLabel: "Tema",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Añadir fecha límite",
    deadlineTitle: "Fecha límite de la tarea",
    saveSettings: "Guardar ajustes",
    minShort: "min",
    addTaskAria: "Añadir tarea",
    fullscreen: "Pantalla completa",
    fullscreenTitle: "Abrir el temporizador a pantalla completa",
    enterFullscreen: "Pantalla completa",
    exitFullscreen: "Salir de pantalla completa",
    close: "Cerrar",
    sessionsToday: "sesiones hoy",
    focusToday: "de enfoque hoy",
    noTaskYet: "Sin tarea elegida",
    openPanel: "Abrir el panel completo con tareas",
    fullscreenTasksLabel: "Mostrar tareas en pantalla completa",
    timerPresetLabel: "Ritmo del temporizador",
    presetClassic: "Clásico · 25/5",
    presetDeep: "Trabajo profundo · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradiano · 90/20",
    presetSprint: "Sprints cortos · 15/3",
    presetCustom: "Personalizado",
    timerFaceLabel: "Aspecto del temporizador",
    faceRing: "Anillo",
    faceDigits: "Solo dígitos",
    faceBreathe: "Círculo que respira",
    studyBuddyLabel: "Compañero capibara con disfraz de luciérnaga",
    tasksDrag: "Arrastrar"
  },
  it: {
    eyebrow: "Widget del pannello laterale",
    title: "Pomodoro Focus",
    modes: { work: "Concentrazione", shortBreak: "Pausa breve", longBreak: "Pausa lunga" },
    hints: {
      work: "Concentrati su un compito. Tutto il resto può aspettare il segnale.",
      shortBreak: "Alzati, bevi acqua e rilassa occhi e spalle.",
      longBreak: "Una pausa più lunga: muoviti, prendi aria fresca o un tè."
    },
    idleHint: "Premi «Avvia» per iniziare o continuare.",
    runningSubtitle: "Il widget resta aperto nel pannello laterale mentre cambi scheda.",
    idleSubtitle: "Un timer tranquillo per concentrazione, pause e attività.",
    start: "Avvia",
    pause: "Pausa",
    nextStage: "Fase successiva",
    reset: "Reimposta",
    compact: "Compatto",
    full: "Completo",
    sessionsTodayLabel: "Oggi",
    sessionsSmall: "sessioni",
    focusTimeLabel: "Concentrazione",
    focusSmall: "tempo",
    goalLabel: "Obiettivo",
    goalSmall: "sessioni",
    tasksTitle: "Attività",
    clearDone: "Cancella completate",
    taskPlaceholder: "Aggiungi un'attività di concentrazione…",
    emptyTask: "Ancora nessuna attività. Aggiungi un'attività principale per il prossimo Pomodoro.",
    markDoneTitle: "Segna come completata",
    deleteTaskTitle: "Elimina attività",
    settingsTitle: "Impostazioni",
    resetStats: "Azzera statistiche",
    workMinutesLabel: "Lavoro, min",
    shortBreakLabel: "Pausa, min",
    longBreakLabel: "Pausa lunga, min",
    cyclesBeforeLongLabel: "Pausa lunga ogni",
    reminderLabel: "Avviso prima della fine, sec",
    dailyGoalLabel: "Obiettivo giornaliero",
    textSizeLabel: "Dimensione del testo, %",
    soundStyleLabel: "Stile del suono",
    soundBright: "Brillante e pulito",
    soundArcade: "Arcade",
    soundBell: "Campana",
    soundSoft: "Morbido",
    autoContinueLabel: "Avvia automaticamente la fase successiva",
    notificationsLabel: "Notifiche di sistema",
    soundsLabel: "Segnali sonori",
    floatingWidgetLabel: "Widget fluttuante sui siti web",
    floatingWidgetQuick: "Widget fluttuante sui siti",
    widgetStateOn: "Attivo",
    widgetStateOff: "Spento",
    fireflyAnimationLabel: "Animazione di lucciole durante la concentrazione",
    fireflyIntervalLabel: "Lucciole ogni",
    fireflyUnitSeconds: "Secondi",
    fireflyUnitMinutes: "Minuti",
    themeLabel: "Tema",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Aggiungi scadenza",
    deadlineTitle: "Scadenza attività",
    saveSettings: "Salva impostazioni",
    minShort: "min",
    addTaskAria: "Aggiungi attività",
    fullscreen: "Schermo intero",
    fullscreenTitle: "Apri il timer a schermo intero",
    enterFullscreen: "Schermo intero",
    exitFullscreen: "Esci da schermo intero",
    close: "Chiudi",
    sessionsToday: "sessioni oggi",
    focusToday: "di concentrazione oggi",
    noTaskYet: "Nessuna attività scelta",
    openPanel: "Apri il pannello completo con le attività",
    fullscreenTasksLabel: "Mostra le attività a schermo intero",
    timerPresetLabel: "Ritmo del timer",
    presetClassic: "Classico · 25/5",
    presetDeep: "Lavoro profondo · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradiano · 90/20",
    presetSprint: "Sprint brevi · 15/3",
    presetCustom: "Personalizzato",
    timerFaceLabel: "Aspetto del timer",
    faceRing: "Anello",
    faceDigits: "Solo cifre",
    faceBreathe: "Cerchio che respira",
    studyBuddyLabel: "Compagno capibara in costume da lucciola",
    tasksDrag: "Trascina"
  },
  sk: {
    eyebrow: "Widget bočného panela",
    title: "Pomodoro Fokus",
    modes: { work: "Sústredenie", shortBreak: "Krátka prestávka", longBreak: "Dlhá prestávka" },
    hints: {
      work: "Sústreď sa na jednu úlohu. Všetko ostatné počká na signál.",
      shortBreak: "Postav sa, napi sa vody a uvoľni oči a ramená.",
      longBreak: "Dlhšia prestávka: pohyb, čerstvý vzduch alebo čaj."
    },
    idleHint: "Stlač „Štart“ pre začatie alebo pokračovanie.",
    runningSubtitle: "Widget zostáva otvorený v bočnom paneli, keď prepínaš karty.",
    idleSubtitle: "Pokojný časovač na sústredenie, prestávky a úlohy.",
    start: "Štart",
    pause: "Pauza",
    nextStage: "Ďalšia fáza",
    reset: "Obnoviť",
    compact: "Kompaktný",
    full: "Plný",
    sessionsTodayLabel: "Dnes",
    sessionsSmall: "relácií",
    focusTimeLabel: "Fokus",
    focusSmall: "čas",
    goalLabel: "Cieľ",
    goalSmall: "relácií",
    tasksTitle: "Úlohy",
    clearDone: "Vymazať hotové",
    taskPlaceholder: "Pridaj jednu úlohu na sústredenie…",
    emptyTask: "Zatiaľ žiadne úlohy. Pridaj jednu hlavnú úlohu pre ďalší Pomodoro.",
    markDoneTitle: "Označiť ako hotové",
    deleteTaskTitle: "Odstrániť úlohu",
    settingsTitle: "Nastavenia",
    resetStats: "Vynulovať štatistiky",
    workMinutesLabel: "Práca, min",
    shortBreakLabel: "Prestávka, min",
    longBreakLabel: "Dlhá prestávka, min",
    cyclesBeforeLongLabel: "Dlhá prestávka každých",
    reminderLabel: "Upozornenie pred koncom, s",
    dailyGoalLabel: "Denný cieľ",
    textSizeLabel: "Veľkosť textu, %",
    soundStyleLabel: "Štýl zvuku",
    soundBright: "Jasný čistý",
    soundArcade: "Arkáda",
    soundBell: "Zvonček",
    soundSoft: "Jemný",
    autoContinueLabel: "Automaticky spustiť ďalšiu fázu",
    notificationsLabel: "Systémové upozornenia",
    soundsLabel: "Zvukové signály",
    floatingWidgetLabel: "Plávajúci widget na weboch",
    floatingWidgetQuick: "Plávajúci widget na weboch",
    widgetStateOn: "Zap.",
    widgetStateOff: "Vyp.",
    fireflyAnimationLabel: "Animácia svetlušiek počas sústredenia",
    fireflyIntervalLabel: "Svetlušky každých",
    fireflyUnitSeconds: "Sekundy",
    fireflyUnitMinutes: "Minúty",
    themeLabel: "Téma",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Pridať termín",
    deadlineTitle: "Termín úlohy",
    saveSettings: "Uložiť nastavenia",
    minShort: "min",
    addTaskAria: "Pridať úlohu",
    fullscreen: "Na celú obrazovku",
    fullscreenTitle: "Otvoriť časovač na celú obrazovku",
    enterFullscreen: "Na celú obrazovku",
    exitFullscreen: "Ukončiť celú obrazovku",
    close: "Zavrieť",
    sessionsToday: "relácií dnes",
    focusToday: "sústredenia dnes",
    noTaskYet: "Nevybraná úloha",
    openPanel: "Otvoriť celý panel s úlohami",
    fullscreenTasksLabel: "Zobraziť úlohy na celej obrazovke",
    timerPresetLabel: "Rytmus časovača",
    presetClassic: "Klasický · 25/5",
    presetDeep: "Hlboká práca · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradiánny · 90/20",
    presetSprint: "Krátke šprinty · 15/3",
    presetCustom: "Vlastný",
    timerFaceLabel: "Vzhľad časovača",
    faceRing: "Prstenec",
    faceDigits: "Iba číslice",
    faceBreathe: "Dýchajúci kruh",
    studyBuddyLabel: "Kapybara-spoločník v kostýme svetlušky",
    tasksDrag: "Presuň"
  },
  cs: {
    eyebrow: "Widget bočního panelu",
    title: "Pomodoro Fokus",
    modes: { work: "Soustředění", shortBreak: "Krátká přestávka", longBreak: "Dlouhá přestávka" },
    hints: {
      work: "Soustřeď se na jeden úkol. Všechno ostatní počká na signál.",
      shortBreak: "Postav se, napij se vody a uvolni oči a ramena.",
      longBreak: "Delší pauza: pohyb, čerstvý vzduch nebo čaj."
    },
    idleHint: "Stiskni „Start“ pro zahájení nebo pokračování.",
    runningSubtitle: "Widget zůstává otevřený v bočním panelu, když přepínáš karty.",
    idleSubtitle: "Klidný časovač pro soustředění, přestávky a úkoly.",
    start: "Start",
    pause: "Pauza",
    nextStage: "Další fáze",
    reset: "Obnovit",
    compact: "Kompaktní",
    full: "Plný",
    sessionsTodayLabel: "Dnes",
    sessionsSmall: "relací",
    focusTimeLabel: "Fokus",
    focusSmall: "čas",
    goalLabel: "Cíl",
    goalSmall: "relací",
    tasksTitle: "Úkoly",
    clearDone: "Smazat hotové",
    taskPlaceholder: "Přidej jeden úkol k soustředění…",
    emptyTask: "Zatím žádné úkoly. Přidej jeden hlavní úkol pro další Pomodoro.",
    markDoneTitle: "Označit jako hotové",
    deleteTaskTitle: "Smazat úkol",
    settingsTitle: "Nastavení",
    resetStats: "Vynulovat statistiky",
    workMinutesLabel: "Práce, min",
    shortBreakLabel: "Přestávka, min",
    longBreakLabel: "Dlouhá přestávka, min",
    cyclesBeforeLongLabel: "Dlouhá přestávka každých",
    reminderLabel: "Upozornění před koncem, s",
    dailyGoalLabel: "Denní cíl",
    textSizeLabel: "Velikost textu, %",
    soundStyleLabel: "Styl zvuku",
    soundBright: "Jasný čistý",
    soundArcade: "Arkáda",
    soundBell: "Zvonek",
    soundSoft: "Jemný",
    autoContinueLabel: "Automaticky spustit další fázi",
    notificationsLabel: "Systémová oznámení",
    soundsLabel: "Zvukové signály",
    floatingWidgetLabel: "Plovoucí widget na webech",
    floatingWidgetQuick: "Plovoucí widget na webech",
    widgetStateOn: "Zap.",
    widgetStateOff: "Vyp.",
    fireflyAnimationLabel: "Animace světlušek při soustředění",
    fireflyIntervalLabel: "Světlušky každých",
    fireflyUnitSeconds: "Sekundy",
    fireflyUnitMinutes: "Minuty",
    themeLabel: "Motiv",
    themeMidnight: "Midnight",
    themeDaylight: "Daylight",
    themeSage: "Sage",
    addDeadlineTitle: "Přidat termín",
    deadlineTitle: "Termín úkolu",
    saveSettings: "Uložit nastavení",
    minShort: "min",
    addTaskAria: "Přidat úkol",
    fullscreen: "Na celou obrazovku",
    fullscreenTitle: "Otevřít časovač na celou obrazovku",
    enterFullscreen: "Na celou obrazovku",
    exitFullscreen: "Ukončit celou obrazovku",
    close: "Zavřít",
    sessionsToday: "relací dnes",
    focusToday: "soustředění dnes",
    noTaskYet: "Nevybraný úkol",
    openPanel: "Otevřít celý panel s úkoly",
    fullscreenTasksLabel: "Zobrazit úkoly na celé obrazovce",
    timerPresetLabel: "Rytmus časovače",
    presetClassic: "Klasický · 25/5",
    presetDeep: "Hluboká práce · 50/10",
    presetDesktime: "DeskTime · 52/17",
    presetUltradian: "Ultradiánní · 90/20",
    presetSprint: "Krátké sprinty · 15/3",
    presetCustom: "Vlastní",
    timerFaceLabel: "Vzhled časovače",
    faceRing: "Prstenec",
    faceDigits: "Jen číslice",
    faceBreathe: "Dýchající kruh",
    studyBuddyLabel: "Kapybara-společník v kostýmu světlušky",
    tasksDrag: "Táhni"
  }
};

const FIREFLY_PALETTE = {
  // Midnight ("Moon"): pale cores over the deep violet, halos on the mode accent.
  midnight: {
    work: { core: "rgba(255, 230, 250, 1)", halo: "rgba(212, 95, 206, .64)", glow: "rgba(178, 50, 175, .72)" },
    shortBreak: { core: "rgba(214, 250, 255, 1)", halo: "rgba(79, 201, 224, .62)", glow: "rgba(40, 170, 196, .70)" },
    longBreak: { core: "rgba(232, 228, 255, 1)", halo: "rgba(154, 140, 242, .62)", glow: "rgba(116, 100, 224, .70)" }
  },
  // Daylight ("Twine"): the deepened hues — the pastels themselves vanish on pastel.
  daylight: {
    work: { core: "rgba(184, 74, 92, 1)", halo: "rgba(154, 54, 72, .55)", glow: "rgba(184, 74, 92, .48)" },
    shortBreak: { core: "rgba(60, 99, 200, 1)", halo: "rgba(44, 76, 168, .55)", glow: "rgba(60, 99, 200, .48)" },
    longBreak: { core: "rgba(147, 51, 165, 1)", halo: "rgba(118, 36, 134, .55)", glow: "rgba(147, 51, 165, .48)" }
  },
  // Sage: warm amber / emerald cores tuned to the green surface.
  sage: {
    work: { core: "rgba(255, 237, 190, 1)", halo: "rgba(245, 158, 11, .60)", glow: "rgba(217, 119, 6, .66)" },
    shortBreak: { core: "rgba(209, 250, 229, 1)", halo: "rgba(52, 211, 153, .60)", glow: "rgba(16, 185, 129, .66)" },
    longBreak: { core: "rgba(237, 233, 255, 1)", halo: "rgba(167, 139, 250, .60)", glow: "rgba(139, 92, 246, .66)" }
  }
};

/*
 * Settings-form helpers, shared by the side panel and the fullscreen sheet.
 * `root` is a document or any element holding the inputs. Anything absent from
 * that root falls back to the value already in `settings`, so a page is free to
 * host only a subset of the form without wiping the rest on save.
 */
function syncFireflyIntervalBounds(root) {
  const value = root.querySelector("#fireflyIntervalValue");
  const unit = root.querySelector("#fireflyIntervalUnit");
  if (!value || !unit) return;

  const isSeconds = (unit.value || "seconds") === "seconds";

  value.min = isSeconds ? "3" : "1";
  value.max = isSeconds ? "300" : "60";
  value.step = "1";

  const current = Number(value.value);
  const min = Number(value.min);
  const max = Number(value.max);

  if (!Number.isFinite(current) || current < min) {
    value.value = isSeconds ? "10" : "5";
    return;
  }

  if (current > max) value.value = String(max);
}

function collectSettingsFrom(root, settings = {}) {
  const num = (id, fallback) => {
    const node = root.querySelector(`#${id}`);
    return node ? Number(node.value) : fallback;
  };
  const str = (id, fallback) => {
    const node = root.querySelector(`#${id}`);
    return node ? node.value : fallback;
  };
  const bool = (id, fallback) => {
    const node = root.querySelector(`#${id}`);
    return node ? node.checked : fallback;
  };

  return {
    workMinutes: num("workMinutes", settings.workMinutes),
    shortBreakMinutes: num("shortBreakMinutes", settings.shortBreakMinutes),
    longBreakMinutes: num("longBreakMinutes", settings.longBreakMinutes),
    cyclesBeforeLong: num("cyclesBeforeLong", settings.cyclesBeforeLong),
    remindBeforeEndSeconds: num("remindBeforeEndSeconds", settings.remindBeforeEndSeconds),
    dailyGoalSessions: num("dailyGoalSessions", settings.dailyGoalSessions),
    textScale: num("textScale", settings.textScale),
    soundTheme: str("soundTheme", settings.soundTheme),
    theme: str("themeSelect", settings.theme),
    timerFace: str("timerFace", settings.timerFace),
    language: str("languageSelect", settings.language),
    fireflyIntervalValue: num("fireflyIntervalValue", settings.fireflyIntervalValue),
    fireflyIntervalUnit: str("fireflyIntervalUnit", settings.fireflyIntervalUnit),
    autoContinue: bool("autoContinue", settings.autoContinue),
    notificationsEnabled: bool("notificationsEnabled", settings.notificationsEnabled),
    soundEnabled: bool("soundEnabled", settings.soundEnabled),
    floatingWidgetEnabled: bool("floatingWidgetEnabled", settings.floatingWidgetEnabled),
    fullscreenTasksEnabled: bool("fullscreenTasksEnabled", settings.fullscreenTasksEnabled),
    studyBuddyEnabled: bool("studyBuddyEnabled", settings.studyBuddyEnabled),
    fireflyAnimationEnabled: bool("fireflyAnimationEnabled", settings.fireflyAnimationEnabled),
    // No input anywhere in the UI — carried through so no save resets them.
    widgetMode: settings.widgetMode || "full",
    floatingWidgetCompact: settings.floatingWidgetCompact === true
  };
}

function applySettingsTo(root, settings) {
  const setValue = (id, value) => {
    const node = root.querySelector(`#${id}`);
    if (node) node.value = value;
  };
  const setChecked = (id, value) => {
    const node = root.querySelector(`#${id}`);
    if (node) node.checked = value;
  };

  setValue("workMinutes", settings.workMinutes);
  setValue("shortBreakMinutes", settings.shortBreakMinutes);
  setValue("longBreakMinutes", settings.longBreakMinutes);
  setValue("cyclesBeforeLong", settings.cyclesBeforeLong);
  setValue("remindBeforeEndSeconds", settings.remindBeforeEndSeconds);
  setValue("dailyGoalSessions", settings.dailyGoalSessions);
  setValue("textScale", settings.textScale ?? 100);
  setValue("soundTheme", settings.soundTheme);
  setValue("themeSelect", settings.theme || "midnight");
  setValue("timerFace", settings.timerFace || "ring");
  setValue("languageSelect", settings.language || "uk");
  setValue("fireflyIntervalUnit", settings.fireflyIntervalUnit || "seconds");
  setValue(
    "fireflyIntervalValue",
    settings.fireflyIntervalValue ?? settings.fireflyIntervalMinutes ?? 10
  );
  syncFireflyIntervalBounds(root);

  setChecked("autoContinue", settings.autoContinue);
  setChecked("notificationsEnabled", settings.notificationsEnabled);
  setChecked("soundEnabled", settings.soundEnabled);
  setChecked("floatingWidgetEnabled", settings.floatingWidgetEnabled !== false);
  setChecked("fullscreenTasksEnabled", settings.fullscreenTasksEnabled !== false);
  setChecked("studyBuddyEnabled", settings.studyBuddyEnabled !== false);
  setChecked("fireflyAnimationEnabled", settings.fireflyAnimationEnabled !== false);

  // Derived, not stored — see TIMER_PRESETS.
  const picker = root.querySelector("#timerPreset");
  if (picker) picker.value = derivePreset(settings);
}

/* Fills every [data-i18n] node under `root` from the given dictionary. */
function applyI18nIn(root, dictionary) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      node.textContent = dictionary[key];
    }
  });
}

/*
 * Task list rendering, shared by the side panel, the fullscreen settings sheet
 * and the fullscreen floating card. `simple` drops the deadline picker and the
 * delete button — the floating card is a glance-and-tick surface, not an editor.
 */
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

/*
 * A fingerprint of everything that changes how the list is drawn. Callers
 * compare it before rebuilding: the 500ms tick would otherwise re-create the
 * rows constantly and slam any open native date picker shut.
 */
function tasksSignature(tasks, lang, extra = "") {
  const list = (tasks || [])
    .map((task) => `${task.id}~${task.text}~${task.done ? 1 : 0}~${task.deadline || ""}`)
    .join("|");
  return `${lang}##${new Date().toDateString()}##${extra}##${list}`;
}

function renderTasksInto(listEl, tasks, dictionary, { simple = false, emptyText } = {}) {
  listEl.replaceChildren();

  if (!tasks.length) {
    const empty = document.createElement("li");
    if (simple) {
      empty.className = "empty";
      empty.textContent = emptyText ?? dictionary.emptyTask;
    } else {
      empty.className = "task";
      empty.innerHTML = `<span></span><span>${emptyText ?? dictionary.emptyTask}</span><span></span>`;
    }
    listEl.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const li = document.createElement("li");
    const urgency = deadlineUrgency(task.deadline, task.done);
    li.className = `task ${task.done ? "done" : ""}`;
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.title = dictionary.markDoneTitle;

    const text = document.createElement("span");
    text.textContent = task.text;

    if (simple) {
      if (urgency) li.classList.add(urgency);
      li.append(checkbox, text);
      listEl.appendChild(li);
      continue;
    }

    if (urgency === "overdue") li.classList.add("has-overdue");

    const body = document.createElement("div");
    body.className = "task-body";

    const deadline = document.createElement("input");
    deadline.type = "date";
    deadline.className = "task-deadline";
    deadline.value = task.deadline || "";
    deadline.title = task.deadline ? dictionary.deadlineTitle : dictionary.addDeadlineTitle;
    if (urgency) deadline.classList.add(urgency);
    if (!task.deadline) deadline.classList.add("is-empty");

    body.append(text, deadline);

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "×";
    del.title = dictionary.deleteTaskTitle;

    li.append(checkbox, body, del);
    listEl.appendChild(li);
  }
}

/*
 * Timer rhythm presets. Deliberately NOT a stored setting: the picker's value
 * is derived from the four durations every time the form is filled, so it can
 * never disagree with hand-edited numbers and the service worker needs to know
 * nothing about it.
 */
const TIMER_PRESETS = {
  classic:   { workMinutes: 25, shortBreakMinutes: 5,  longBreakMinutes: 15, cyclesBeforeLong: 4 },
  deep:      { workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 30, cyclesBeforeLong: 2 },
  desktime:  { workMinutes: 52, shortBreakMinutes: 17, longBreakMinutes: 25, cyclesBeforeLong: 3 },
  ultradian: { workMinutes: 90, shortBreakMinutes: 20, longBreakMinutes: 30, cyclesBeforeLong: 2 },
  sprint:    { workMinutes: 15, shortBreakMinutes: 3,  longBreakMinutes: 10, cyclesBeforeLong: 4 }
};

const PRESET_FIELDS = ["workMinutes", "shortBreakMinutes", "longBreakMinutes", "cyclesBeforeLong"];

function derivePreset(values) {
  for (const [name, preset] of Object.entries(TIMER_PRESETS)) {
    if (PRESET_FIELDS.every((field) => Number(values[field]) === preset[field])) return name;
  }
  return "custom";
}

/* Two-way: picking a rhythm fills the durations, editing a duration by hand
   drops the picker back to "Custom". */
function bindPresetPicker(root) {
  const picker = root.querySelector("#timerPreset");
  if (!picker) return;

  picker.addEventListener("change", () => {
    const preset = TIMER_PRESETS[picker.value];
    if (!preset) return;
    for (const field of PRESET_FIELDS) {
      const input = root.querySelector(`#${field}`);
      if (input) input.value = preset[field];
    }
  });

  for (const field of PRESET_FIELDS) {
    root.querySelector(`#${field}`)?.addEventListener("input", () => {
      const current = {};
      for (const other of PRESET_FIELDS) {
        current[other] = root.querySelector(`#${other}`)?.value;
      }
      picker.value = derivePreset(current);
    });
  }
}

/*
 * Study buddy — a pixel-art capybara in a firefly costume that paces along the
 * bottom of the timer.
 *
 * The sprite is built from a character grid: one cell = one viewBox unit, drawn
 * with shape-rendering="crispEdges" so the pixels stay hard-edged at any size.
 * Letters name CSS classes rather than colours, so the palette stays in
 * sidepanel.css with everything else — the costume follows --accent while the
 * fur stays warm brown in every theme, because this is a character, not chrome.
 * Inline SVG, no assets: the extension ships nothing it has to fetch.
 *
 * Reacts to body[data-running]: walks and flutters while the timer runs, stops
 * where it stands with its eyes shut and a "z" drifting up when it does not.
 * All the motion lives in sidepanel.css, shared by the panel and fullscreen.
 */
const BUDDY_CLASSES = {
  f: "px-fur",        // mid brown
  d: "px-fur-dark",   // shading under the sunlit back, far legs
  l: "px-fur-light",  // sunlit back and belly
  m: "px-muzzle",
  n: "px-nose",       // nose and mouth
  a: "px-glow",       // costume — follows --accent
  g: "px-glow-hot",   // the bright core of the glow
};

/*
 * Facing right, 32 columns wide — CSS only has to mirror it when it turns.
 * The head is deliberately set three rows above the back with a notch between
 * them: without that shoulder line the whole animal reads as one long loaf.
 */
const BUDDY_BODY = [
  "................g.............g.",
  ".................a...........a..",
  "..................a.........a...",
  "...................a.ddd...a....",
  "...................a.ddd...a....",
  "....................fffffffff...",
  "...................fffffffffff..",
  "...................ffffffffffff.",
  ".....lllllllllllll.ffffffffffff.",
  "...ffffffffffffffffffffffffmmnn.",
  "..fffddddddddffffffffffffffmmnn.",
  ".fffffdddddddffffffffffffffmmmm.",
  ".ffffffffffffffffffffffffffmnnm.",
  ".ffffffffffffffffffffffffffmmm..",
  ".ffffffffffffffffffffffffff.....",
  ".fffllllllllllllllfffffff.......",
  ".fflllllllllllllllffff..........",
  "..flllllllllllllllfff...........",
  "...ddddddddddddddddd............",
];

/*
 * Two leg poses, swapped a few times a second: standing square, then mid-swing
 * with each leg two cells from where it was. The near pair is fur-coloured and
 * the far pair dark, so four legs read as two sides rather than a fence. The
 * body drops a pixel on the swing frame — what a real stride does, and what
 * sells the walk at this size.
 */
const BUDDY_LEGS = [
  [
    ".....ff.dd....ff.dd.............",
    ".....ff.dd....ff.dd.............",
    ".....dd.dd....dd.dd.............",
  ],
  [
    "....ff...dd..ff...dd............",
    "...ff.....dd.ff....dd...........",
    "...dd.....dd.dd....dd...........",
  ],
];

/* One wing, drawn twice at different offsets so the far one peeks out. */
const BUDDY_WING = [
  "aaaa........",
  "aaaaaaa.....",
  ".aaaaaaaaa..",
  "..aaaaaaaaa.",
  ".....aaaaaa.",
  "........aa..",
];

function buddyRects(rows, offsetX, offsetY) {
  const runs = [];

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      if (!BUDDY_CLASSES[key]) {
        x += 1;
        continue;
      }

      let w = 1;
      while (row[x + w] === key) w += 1;

      const above = runs.find(
        (r) => r.key === key && r.x === x && r.w === w && r.y + r.h === y
      );
      if (above) above.h += 1;
      else runs.push({ key, x, y, w, h: 1 });

      x += w;
    }
  });

  return runs
    .map(
      (r) =>
        `<rect class="${BUDDY_CLASSES[r.key]}" x="${r.x + offsetX}" y="${r.y + offsetY}"` +
        ` width="${r.w}" height="${r.h}"/>`
    )
    .join("");
}

/* A pixel "z": top bar, a diagonal down to the left, bottom bar. */
function buddyZ(x, y, size, cls) {
  const parts = [`<rect x="${x}" y="${y}" width="${size}" height="1"/>`];
  for (let i = 1; i < size - 1; i += 1) {
    parts.push(`<rect x="${x + size - 1 - i}" y="${y + i}" width="1" height="1"/>`);
  }
  parts.push(`<rect x="${x}" y="${y + size - 1}" width="${size}" height="1"/>`);
  return `<g class="buddy-z ${cls}">${parts.join("")}</g>`;
}

function buildBuddySvg() {
  const legs = BUDDY_LEGS
    .map(
      (frame, i) =>
        `<g class="buddy-legs buddy-legs-${i === 0 ? "a" : "b"}">${buddyRects(frame, 0, 19)}</g>`
    )
    .join("");

  // Legs are drawn before the body so the body hides their tops when it dips.
  return `
<svg class="buddy-art" viewBox="-6 -8 40 30" xmlns="http://www.w3.org/2000/svg"
     shape-rendering="crispEdges" aria-hidden="true" focusable="false">
  <g class="buddy-sleep">
    ${buddyZ(10, -3, 3, "buddy-z1")}
    ${buddyZ(15, -7, 4, "buddy-z2")}
  </g>
  ${legs}
  <g class="buddy-body">
    <g class="buddy-lamp">
      <rect class="px-halo" x="-5" y="12" width="8" height="6"/>
      <rect class="px-halo" x="-4" y="11" width="6" height="8"/>
      <rect class="px-glow" x="-2" y="13" width="2" height="4"/>
      <rect class="px-glow-hot" x="-2" y="13" width="1" height="1"/>
    </g>
    <g class="buddy-wings">
      <g class="buddy-wing-far">${buddyRects(BUDDY_WING, 8, 1)}</g>
      <g class="buddy-wing-near">${buddyRects(BUDDY_WING, 6, 3)}</g>
    </g>
    ${buddyRects(BUDDY_BODY, 0, 0)}
    <rect class="px-eye buddy-eye-open" x="24" y="9" width="2" height="2"/>
    <rect class="px-eye buddy-eye-shut" x="23" y="10" width="3" height="1"/>
  </g>
</svg>`;
}

let buddySvgCache = null;

/*
 * The .buddy-walk wrapper is the thing that travels: it spans the whole host
 * and slides the sprite from one edge to the other, so neither page needs any
 * markup beyond the empty #studyBuddy container.
 */
function renderBuddyInto(host) {
  if (!host || host.dataset.ready === "1") return;
  if (!buddySvgCache) buddySvgCache = buildBuddySvg();
  host.innerHTML = `<div class="buddy-walk">${buddySvgCache}</div>`;
  host.dataset.ready = "1";
}
