/*
 * The program's own words, in one place. main.js takes them with require(), and
 * the pages with a <script>, which leaves the extension's dictionaries as they
 * are: on a website "widget on websites" is still the right thing to say.
 *
 *   program  the menus and the notification, in main.js
 *   pages    added over i18n in shared.js, for the main window and the settings
 *   widget   added over floating_widget.js's own dictionary, on the layer
 */
const DESKTOP_WORDS = {
  uk: {
    program: {
      open: "Відкрити Firefly Focus",
      widgets: "Віджети на екрані",
      launcher: "Ярлик на екрані",
      quit: "Закрити програму й зупинити таймер",
      hintTitle: "Firefly Focus працює далі",
      hint: "Вікно згорнуто, таймер іде далі. Завершити роботу можна в налаштуваннях або через значок біля годинника.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "Таймер іде далі, поки ти працюєш в інших програмах.",
      floatingWidgetQuick: "Віджети поверх програм",
      floatingWidgetLabel: "Віджети поверх програм",
      desktopWidgetKindLabel: "Що показує віджет",
      desktopKindTimer: "Лише таймер",
      desktopKindTasks: "Таймер і задачі",
      desktopKindFull: "Таймер, задачі й кіт",
      desktopLauncherLabel: "Ярлик поверх програм",
      desktopQuit: "Закрити програму й зупинити таймер",
    },
    widget: {
      closeTitle: "Сховати (поверне ярлик)",
      openHint: "Відкрити на весь екран",
      walkMode: "Гуляти по екрану",
    },
  },
  en: {
    program: {
      open: "Open Firefly Focus",
      widgets: "Widgets on screen",
      launcher: "Icon on screen",
      quit: "Close the program and stop the timer",
      hintTitle: "Firefly Focus keeps running",
      hint: "The window is minimized and the timer carries on. To quit, use the settings or the icon by the clock.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "The timer carries on while you work in other programs.",
      floatingWidgetQuick: "Widgets over other programs",
      floatingWidgetLabel: "Widgets over other programs",
      desktopWidgetKindLabel: "What the widget shows",
      desktopKindTimer: "Just the timer",
      desktopKindTasks: "Timer and tasks",
      desktopKindFull: "Timer, tasks and cat",
      desktopLauncherLabel: "Icon over other programs",
      desktopQuit: "Close the program and stop the timer",
    },
    widget: {
      closeTitle: "Hide (the on-screen icon brings it back)",
      openHint: "Open full screen",
      walkMode: "Walk around the screen",
    },
  },
  de: {
    program: {
      open: "Firefly Focus öffnen",
      widgets: "Widgets auf dem Bildschirm",
      launcher: "Symbol auf dem Bildschirm",
      quit: "Programm schließen und Timer stoppen",
      hintTitle: "Firefly Focus läuft weiter",
      hint: "Das Fenster ist minimiert, der Timer läuft weiter. Beenden kannst du es in den Einstellungen oder über das Symbol neben der Uhr.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "Der Timer läuft weiter, während du in anderen Programmen arbeitest.",
      floatingWidgetQuick: "Widgets über anderen Programmen",
      floatingWidgetLabel: "Widgets über anderen Programmen",
      desktopWidgetKindLabel: "Was das Widget zeigt",
      desktopKindTimer: "Nur der Timer",
      desktopKindTasks: "Timer und Aufgaben",
      desktopKindFull: "Timer, Aufgaben und Katze",
      desktopLauncherLabel: "Symbol über anderen Programmen",
      desktopQuit: "Programm schließen und Timer stoppen",
    },
    widget: {
      closeTitle: "Ausblenden (das Symbol bringt es zurück)",
      openHint: "Im Vollbild öffnen",
      walkMode: "Über den Bildschirm laufen",
    },
  },
  es: {
    program: {
      open: "Abrir Firefly Focus",
      widgets: "Widgets en pantalla",
      launcher: "Icono en pantalla",
      quit: "Cerrar el programa y detener el temporizador",
      hintTitle: "Firefly Focus sigue en marcha",
      hint: "La ventana está minimizada y el temporizador sigue. Para salir, usa los ajustes o el icono junto al reloj.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "El temporizador sigue mientras trabajas en otros programas.",
      floatingWidgetQuick: "Widgets sobre otros programas",
      floatingWidgetLabel: "Widgets sobre otros programas",
      desktopWidgetKindLabel: "Qué muestra el widget",
      desktopKindTimer: "Solo el temporizador",
      desktopKindTasks: "Temporizador y tareas",
      desktopKindFull: "Temporizador, tareas y gato",
      desktopLauncherLabel: "Icono sobre otros programas",
      desktopQuit: "Cerrar el programa y detener el temporizador",
    },
    widget: {
      closeTitle: "Ocultar (el icono lo trae de vuelta)",
      openHint: "Abrir a pantalla completa",
      walkMode: "Pasear por la pantalla",
    },
  },
  it: {
    program: {
      open: "Apri Firefly Focus",
      widgets: "Widget sullo schermo",
      launcher: "Icona sullo schermo",
      quit: "Chiudi il programma e ferma il timer",
      hintTitle: "Firefly Focus resta attivo",
      hint: "La finestra è ridotta a icona e il timer continua. Per uscire, usa le impostazioni o l'icona accanto all'orologio.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "Il timer continua mentre lavori in altri programmi.",
      floatingWidgetQuick: "Widget sopra gli altri programmi",
      floatingWidgetLabel: "Widget sopra gli altri programmi",
      desktopWidgetKindLabel: "Cosa mostra il widget",
      desktopKindTimer: "Solo il timer",
      desktopKindTasks: "Timer e attività",
      desktopKindFull: "Timer, attività e gatto",
      desktopLauncherLabel: "Icona sopra gli altri programmi",
      desktopQuit: "Chiudi il programma e ferma il timer",
    },
    widget: {
      closeTitle: "Nascondi (l'icona lo riporta)",
      openHint: "Apri a schermo intero",
      walkMode: "Passeggiare per lo schermo",
    },
  },
  sk: {
    program: {
      open: "Otvoriť Firefly Focus",
      widgets: "Widgety na obrazovke",
      launcher: "Ikona na obrazovke",
      quit: "Zavrieť program a zastaviť časovač",
      hintTitle: "Firefly Focus beží ďalej",
      hint: "Okno je minimalizované a časovač beží ďalej. Ukončiť ho môžeš v nastaveniach alebo cez ikonu pri hodinách.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "Časovač beží ďalej, kým pracuješ v iných programoch.",
      floatingWidgetQuick: "Widgety nad ostatnými programami",
      floatingWidgetLabel: "Widgety nad ostatnými programami",
      desktopWidgetKindLabel: "Čo widget ukazuje",
      desktopKindTimer: "Iba časovač",
      desktopKindTasks: "Časovač a úlohy",
      desktopKindFull: "Časovač, úlohy a mačka",
      desktopLauncherLabel: "Ikona nad ostatnými programami",
      desktopQuit: "Zavrieť program a zastaviť časovač",
    },
    widget: {
      closeTitle: "Skryť (ikona ho vráti)",
      openHint: "Otvoriť na celú obrazovku",
      walkMode: "Prechádzať sa po obrazovke",
    },
  },
  cs: {
    program: {
      open: "Otevřít Firefly Focus",
      widgets: "Widgety na obrazovce",
      launcher: "Ikona na obrazovce",
      quit: "Zavřít program a zastavit časovač",
      hintTitle: "Firefly Focus běží dál",
      hint: "Okno je minimalizované a časovač běží dál. Ukončit ho můžeš v nastavení nebo přes ikonu u hodin.",
    },
    pages: {
      eyebrow: "Firefly Focus",
      runningSubtitle: "Časovač běží dál, zatímco pracuješ v jiných programech.",
      floatingWidgetQuick: "Widgety nad ostatními programy",
      floatingWidgetLabel: "Widgety nad ostatními programy",
      desktopWidgetKindLabel: "Co widget ukazuje",
      desktopKindTimer: "Jen časovač",
      desktopKindTasks: "Časovač a úkoly",
      desktopKindFull: "Časovač, úkoly a kočka",
      desktopLauncherLabel: "Ikona nad ostatními programy",
      desktopQuit: "Zavřít program a zastavit časovač",
    },
    widget: {
      closeTitle: "Skrýt (ikona ho vrátí)",
      openHint: "Otevřít na celou obrazovku",
      walkMode: "Procházet se po obrazovce",
    },
  },
};

if (typeof module !== "undefined") module.exports = DESKTOP_WORDS;
