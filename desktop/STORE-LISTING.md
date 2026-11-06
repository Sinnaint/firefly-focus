# Microsoft Store: що куди вписувати

Усе для подання в Partner Center. Правила звірено з [Microsoft Store Policies 7.20](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies) (вересень 2026).

## Порядок дій

1. Зареєструвати акаунт розробника: [storedeveloper.microsoft.com](https://storedeveloper.microsoft.com).
2. Зарезервувати назву **Firefly Focus**. Саме так, без «Pomodoro Timer & Tasks»: правило 10.1.1 забороняє описовий текст у назві.
3. На сторінці **Product identity** взяти три значення й вписати в `desktop/store-identity.json`:
   - `Package/Identity/Name` → `identityName`
   - `Package/Identity/Publisher` → `publisher`
   - `Package/Properties/PublisherDisplayName` → `publisherDisplayName`
4. Зібрати пакет: `npm.cmd --prefix desktop run dist`. Результат: `desktop/dist/FireflyFocus-1.0.0-x64.appx`. Без кроку 3 Store його не прийме: значення мають збігатися.
5. Перед поданням злити гілку `desktop` у `main`, інакше посилання на політику конфіденційності покаже стару версію.
6. Заповнити розділи нижче й подати на сертифікацію.

Підписувати пакет не треба: Store підписує сам.

## Властивості (Properties)

| Поле | Значення |
|---|---|
| Category | Productivity |
| Privacy policy URL | `https://github.com/Sinnaint/firefly-focus/blob/main/PRIVACY.md` |
| Website | `https://github.com/Sinnaint/firefly-focus` |
| Support contact info | `https://github.com/Sinnaint/firefly-focus/issues` |
| Системні вимоги | Windows 10 версії 2004 або новіша, 64-розрядна |

На запитання, чи програма працює з персональними даними, Store сам поставить **Yes**, бо бачить `runFullTrust`, і вимагатиме політику. Це нормально: правило 10.5.1 вимагає її від усіх настільних програм, навіть якщо вони нічого не збирають. Наша [PRIVACY.md](../PRIVACY.md) це покриває.

Pricing and availability: **Free**, усі ринки.

## Анкета віку (Age ratings, IARC)

Заповнюється раз, на всі запитання відповідь **No**. Тип програми: не гра, не соцмережа, не браузер (остання категорія, «all other app types»). Очікуваний результат: 3+ / Everyone.

- Насильство, кров, страшний вміст: ні. Кота можна підхопити й кинути, але він приземляється й сідає, нічого йому не стається.
- Сексуальний вміст, нецензурна лексика, азартні ігри, алкоголь, наркотики: ні.
- Спілкування між користувачами, вміст від користувачів, який бачать інші: ні.
- Передавання місцеперебування чи персональних даних: ні.
- Покупки в програмі, реклама: ні.
- Вільний доступ до інтернету: ні.

Microsoft передає IARC ім'я видавця й пошту акаунта, це стандартна частина процедури.

## Параметри подання (Submission options)

**Restricted capabilities, чому потрібен `runFullTrust`:**

```
Firefly Focus is a desktop application built with Electron and packaged as a full-trust Win32 app, an app model that requires runFullTrust. The app uses it to run its own windows and to show a small always-on-top icon and a click-through layer with its timer widget over other programs. An optional game, off by default, also asks the shell for the positions of desktop icons, through its documented interfaces, so that an animated cat can play around them, and a second setting, also off by default, lets the cat move icons to other places on the desktop. The app does not read the contents of other programs' windows, the user's files or keystrokes, and it makes no network requests.
```

**Notes for certification:**

```
No account, sign-in or internet connection is needed. The app makes no network requests.

On first start you will see the main window, a small round-cornered icon at the top right of the screen, a timer widget under it and a cat at the bottom right. The layer holding the widgets lets clicks through everywhere except on the widgets themselves.

To test:
- Press Start on the widget or in the main window. Set a short stage with the sliders button that appears on the widget's top edge when the pointer is over it (type 1 next to Work).
- Click the time on the widget to open the fullscreen timer. Close it with the X in its top right corner.
- Click the small icon to close or open the widgets. Right-click it, or the tray icon, for the menu.
- The X of the main window only minimizes it, since the timer keeps running, and the first time a notification says so.
- To quit: "Close the program and stop the timer" in the menu or at the bottom of the settings in the main window.
- The widgets appear on the main display only. The language follows the system's, falling back to English, and can be changed in the main window.
- Optional, off by default: "The cat gets up to mischief with desktop icons" in the settings. With it on, and the desktop in view, the cat jumps on icons, hides behind them and sometimes bites one. While it holds a bitten icon, the app's own transparent layer takes mouse clicks on that icon, so it does not open with the mouse. Nothing about the icon changes and the keyboard still opens it. Clicking the cat, dragging it away, turning on the ball, or a window covering the icon all release it at once, and the cat lets go by itself after a minute or so. It is a helper program in the package, desktop-icons.exe, that reads the positions. It reads no names and does not use the network.
- Optional, off by default, and only available with the above on: "The cat can drag icons around the desktop". The cat then takes an icon in its teeth and pulls it somewhere else on the desktop. This changes only the icon's position, through the shell's documented IFolderView interface, the same as dragging it with the mouse: no file is moved, renamed or changed. It keeps at most two icons out of place. They go back when this or the game is switched off and when the app closes, or at the next start after a crash. An icon the user has moved since is left where it is.
- "Show what the cat can do", on the cat's toolbar, in the settings and in the menu, runs through all of the above on folders the app draws on its own layer. It touches no real icon and needs neither setting. Skip on with "Next" or end it with "Finish".
- During a running focus session the cat does not bite or drag icons or hunt, so to see those, leave the timer stopped or use a break.
```

## Лістинг (Store listings)

Пакет заявляє 7 мов, тому опис має бути кожною (правило 10.7). Скриншоти кожною мовою робить `npm.cmd --prefix desktop run screenshots`, вони з'являються в `desktop/dist/store-screenshots/<мова>/`. Вимоги: PNG від 1366×768, не більше 10, рекомендовано від чотирьох. Кожній мові їх завантажують окремо.

Значок для лістингу: `desktop/build/store/AppTile-300x300.png`. Трейлер необов'язковий, але кіт, що гуляє екраном, найкраще продає себе на відео.

Спільне для всіх мов:

- **Copyright:** `© 2026 Sinnaint`
- **Additional license terms:** `MIT License: https://github.com/Sinnaint/firefly-focus/blob/main/LICENSE`

Слово «Pomodoro» в описах вжито лише як назву методу, не в назві програми: у кількох країнах це зареєстрована торгова марка її автора.

---

### English (en-US)

**Description**

```
Firefly Focus is a calm focus timer that stays with you while you work. A small icon and a compact timer float over your other programs, so you can see how much time is left without leaving what you are doing. When you want nothing else on the screen, one click opens a clean fullscreen timer with drifting fireflies.

A pixel-art cat keeps you company: it strolls across your screen, peeks in from behind its edges, chases a bouncing ball all over it and purrs when you pet it. Pick up the cat or the ball and toss them wherever you like.

WHAT IT DOES
• Focus sessions, short breaks and long breaks in the Pomodoro style, with ready-made rhythms (25/5, 50/10, 52/17, 90/20, 15/3) or your own.
• Change the rhythm in a couple of clicks, right from the widget.
• Tasks with optional deadlines: overdue ones turn red, those due soon turn amber.
• Choose what the widget shows: just the timer, the timer and tasks, or all that and the cat.
• Put everything away when you want to: the timer keeps running in the background, with its progress on the taskbar button.
• If you like, a little mischief: switch on the cat's game with your desktop icons, and it hides behind them, jumps on them and bites one now and then. A bitten icon will not open with the mouse until you click the cat, pull it away or turn on the ball. It stays off until you switch it on. With a second setting it also drags icons to new places, never touching the files, and puts them back when you switch that off or close the program.
• A cat with a life of its own: it hunts a firefly and your mouse pointer, and now and then tears across the whole screen. During a focus session it behaves, and when one ends it is delighted. One click shows you all it can do.
• Daily statistics and a daily goal.
• Three themes, three timer faces, four sound styles and notifications.
• Seven languages: English, Ukrainian, German, Spanish, Italian, Slovak and Czech.

PRIVATE BY DESIGN
No account, no ads, no analytics. The program does not connect to the internet. Your tasks, settings and statistics stay on your computer and are removed when you uninstall it.

GOOD TO KNOW
• The widgets and the cat appear on your main display.
• Your data stays on this computer, so it does not sync between devices.
• Closing the main window keeps the timer running. To stop it, use "Close the program and stop the timer".
```

**Keywords:** `pomodoro`, `focus timer`, `productivity`, `study timer`, `tasks`, `always on top`, `desktop cat`

**Screenshot captions**

1. `01-fullscreen`: `A clean fullscreen timer with fireflies, your tasks and the cat`
2. `02-widgets`: `The timer, your tasks and the cat over whatever you are working in`
3. `03-timer-settings`: `Change the rhythm in a couple of clicks`
4. `04-fullscreen-daylight`: `The light Daylight theme`
5. `05-fullscreen-sage`: `The calm Sage theme with a breathing timer`
6. `06-main-window`: `Tasks with deadlines, statistics and settings in the main window`

---

### Українська (uk-UA)

**Опис**

```
Firefly Focus — спокійний таймер фокусу, який лишається поруч, поки ви працюєте. Маленький значок і компактний таймер плавають поверх інших програм, тож видно, скільки часу лишилось, і не треба ні на що перемикатися. А коли хочеться, щоб на екрані не було нічого зайвого, один клік відкриває чистий таймер на весь екран зі світлячками.

Компанію складає піксельний кіт: гуляє екраном, визирає з-за його країв, ганяє стрибучий м'ячик по всьому екрану й муркоче, коли його гладять. І кота, і м'ячик можна підхопити й закинути куди завгодно.

ЩО ВМІЄ
• Робота, короткі й довгі перерви за методом Pomodoro, з готовими ритмами (25/5, 50/10, 52/17, 90/20, 15/3) або власним.
• Ритм змінюється за пару кліків, просто з віджета.
• Задачі з необов'язковими дедлайнами: прострочені стають червоними, а ті, що скоро, бурштиновими.
• Ви обираєте, що показує віджет: лише таймер, таймер із задачами або ще й кота.
• Усе можна прибрати з екрана: таймер працює далі у фоні, а його хід видно на кнопці панелі завдань.
• Якщо хочеться, трохи пустощів: увімкніть гру кота зі значками на робочому столі, і він ховатиметься за ними, стрибатиме по них і часом надкусить якийсь. Надкушений значок не відкривається мишею, поки не клацнете по коту, не відтягнете його або не ввімкнете м'ячик. Без вашого вмикання цього не буде. Окреме налаштування дозволяє йому ще й тягати значки на нові місця. Файлів це не чіпає, а значки повертаються, щойно ви це вимкнете або закриєте програму.
• Кіт із власним характером: полює на світлячка й курсор миші, а часом мчить через увесь екран. Під час фокусу не пустує, а коли фокус закінчився, радіє. Один клік показує все, що він уміє.
• Статистика за день і денна ціль.
• Три теми, три вигляди таймера, чотири стилі звуку й сповіщення.
• Сім мов: українська, англійська, німецька, іспанська, італійська, словацька й чеська.

ПРИВАТНІСТЬ
Без акаунта, реклами й аналітики. Програма не виходить в інтернет. Задачі, налаштування й статистика лишаються на вашому комп'ютері й видаляються разом із програмою.

ВАРТО ЗНАТИ
• Віджети й кіт з'являються на головному екрані.
• Дані лежать на цьому комп'ютері, тому між пристроями не синхронізуються.
• Якщо закрити головне вікно, таймер іде далі. Зупиняє його пункт «Закрити програму й зупинити таймер».
```

**Ключові слова:** `помодоро`, `таймер фокусу`, `продуктивність`, `таймер для навчання`, `задачі`, `поверх вікон`, `кіт на робочому столі`

**Підписи до скриншотів**

1. `01-fullscreen`: `Чистий таймер на весь екран зі світлячками, задачами й котом`
2. `02-widgets`: `Таймер, задачі й кіт поверх програми, у якій ви працюєте`
3. `03-timer-settings`: `Ритм змінюється за пару кліків`
4. `04-fullscreen-daylight`: `Світла тема Daylight`
5. `05-fullscreen-sage`: `Спокійна тема Sage і дихальний таймер`
6. `06-main-window`: `Задачі з дедлайнами, статистика й налаштування в головному вікні`

---

### Deutsch (de-DE)

**Beschreibung**

```
Firefly Focus ist ein ruhiger Fokus-Timer, der dich bei der Arbeit begleitet. Ein kleines Symbol und ein kompakter Timer schweben über deinen anderen Programmen, sodass du jederzeit siehst, wie viel Zeit noch bleibt, ohne deine Arbeit zu verlassen. Soll nichts anderes auf dem Bildschirm sein, öffnet ein Klick einen aufgeräumten Vollbild-Timer mit schwebenden Glühwürmchen.

Eine Pixel-Katze leistet dir Gesellschaft: Sie spaziert über den Bildschirm, lugt hinter seinen Rändern hervor, jagt einen hüpfenden Ball quer darüber und schnurrt, wenn du sie streichelst. Katze und Ball kannst du hochheben und werfen, wohin du willst.

WAS ES KANN
• Fokusphasen, kurze und lange Pausen nach der Pomodoro-Methode, mit fertigen Rhythmen (25/5, 50/10, 52/17, 90/20, 15/3) oder deinem eigenen.
• Den Rhythmus änderst du mit wenigen Klicks direkt im Widget.
• Aufgaben mit optionalen Fristen: Überfällige werden rot, bald fällige bernsteinfarben.
• Du bestimmst, was das Widget zeigt: nur den Timer, Timer und Aufgaben oder dazu die Katze.
• Alles lässt sich wegräumen: Der Timer läuft im Hintergrund weiter, sein Fortschritt ist auf der Taskleisten-Schaltfläche zu sehen.
• Wenn du magst, ein wenig Unfug: Schalte das Spiel der Katze mit deinen Desktop-Symbolen ein, dann versteckt sie sich dahinter, springt darauf und beißt ab und zu in eines. Ein angebissenes Symbol öffnet sich nicht per Maus, bis du die Katze anklickst, wegziehst oder den Ball einschaltest. Ohne dein Einschalten bleibt es aus. Mit einer zweiten Einstellung zieht sie Symbole auch an neue Plätze. Die Dateien bleiben unberührt, und die Symbole kehren zurück, sobald du das ausschaltest oder das Programm schließt.
• Eine Katze mit eigenem Kopf: Sie jagt ein Glühwürmchen und deinen Mauszeiger und rast ab und zu über den ganzen Bildschirm. Während einer Fokus-Sitzung benimmt sie sich, und wenn sie endet, freut sie sich. Ein Klick zeigt dir alles, was sie kann.
• Tagesstatistik und Tagesziel.
• Drei Designs, drei Timer-Ansichten, vier Klangstile und Benachrichtigungen.
• Sieben Sprachen: Deutsch, Englisch, Ukrainisch, Spanisch, Italienisch, Slowakisch und Tschechisch.

DATENSCHUTZ
Kein Konto, keine Werbung, keine Analyse. Das Programm verbindet sich nicht mit dem Internet. Aufgaben, Einstellungen und Statistiken bleiben auf deinem Computer und werden bei der Deinstallation entfernt.

GUT ZU WISSEN
• Die Widgets und die Katze erscheinen auf dem Hauptbildschirm.
• Deine Daten bleiben auf diesem Computer und werden nicht zwischen Geräten synchronisiert.
• Wird das Hauptfenster geschlossen, läuft der Timer weiter. Beendet wird er mit „Programm schließen und Timer stoppen“.
```

**Suchbegriffe:** `pomodoro`, `fokus timer`, `produktivität`, `lerntimer`, `aufgaben`, `immer im vordergrund`, `desktop katze`

**Bildunterschriften**

1. `01-fullscreen`: `Aufgeräumter Vollbild-Timer mit Glühwürmchen, Aufgaben und Katze`
2. `02-widgets`: `Timer, Aufgaben und Katze über dem Programm, in dem du arbeitest`
3. `03-timer-settings`: `Den Rhythmus mit wenigen Klicks ändern`
4. `04-fullscreen-daylight`: `Das helle Design Daylight`
5. `05-fullscreen-sage`: `Das ruhige Design Sage mit atmendem Timer`
6. `06-main-window`: `Aufgaben mit Fristen, Statistik und Einstellungen im Hauptfenster`

---

### Español (es-ES)

**Descripción**

```
Firefly Focus es un temporizador de enfoque tranquilo que te acompaña mientras trabajas. Un pequeño icono y un temporizador compacto flotan sobre tus otros programas, así ves cuánto tiempo queda sin dejar lo que estás haciendo. Y cuando no quieres nada más en la pantalla, un clic abre un temporizador limpio a pantalla completa con luciérnagas a la deriva.

Un gato de píxeles te hace compañía: pasea por la pantalla, se asoma por detrás de sus bordes, persigue una pelota que rebota por toda ella y ronronea cuando lo acaricias. Puedes coger al gato o la pelota y lanzarlos donde quieras.

QUÉ HACE
• Sesiones de enfoque y descansos cortos y largos al estilo Pomodoro, con ritmos listos para usar (25/5, 50/10, 52/17, 90/20, 15/3) o el tuyo propio.
• Cambia el ritmo en un par de clics, directamente desde el widget.
• Tareas con fecha límite opcional: las vencidas se ponen en rojo y las próximas, en ámbar.
• Elige qué muestra el widget: solo el temporizador, el temporizador y las tareas, o además el gato.
• Guárdalo todo cuando quieras: el temporizador sigue en segundo plano y su progreso se ve en el botón de la barra de tareas.
• Si quieres, algo de travesura: activa el juego del gato con los iconos del escritorio, y se esconderá detrás, saltará sobre ellos y de vez en cuando morderá uno. Un icono mordido no se abre con el ratón hasta que hagas clic en el gato, lo apartes o actives la pelota. Sigue desactivado hasta que lo actives. Con un segundo ajuste también arrastra iconos a otros lugares, sin tocar los archivos, y los devuelve en cuanto lo desactivas o cierras el programa.
• Un gato con vida propia: caza una luciérnaga y el puntero del ratón, y de vez en cuando cruza toda la pantalla a toda velocidad. Durante una sesión de enfoque se porta bien, y cuando termina se alegra. Un clic te muestra todo lo que sabe hacer.
• Estadísticas diarias y un objetivo diario.
• Tres temas, tres vistas del temporizador, cuatro estilos de sonido y notificaciones.
• Siete idiomas: español, inglés, ucraniano, alemán, italiano, eslovaco y checo.

PRIVACIDAD
Sin cuenta, sin anuncios, sin analíticas. El programa no se conecta a internet. Tus tareas, ajustes y estadísticas se quedan en tu equipo y se eliminan al desinstalarlo.

CONVIENE SABER
• Los widgets y el gato aparecen en la pantalla principal.
• Tus datos se quedan en este equipo, así que no se sincronizan entre dispositivos.
• Al cerrar la ventana principal, el temporizador sigue en marcha. Para detenerlo, usa «Cerrar el programa y detener el temporizador».
```

**Palabras clave:** `pomodoro`, `temporizador de enfoque`, `productividad`, `temporizador de estudio`, `tareas`, `siempre visible`, `gato de escritorio`

**Pies de captura**

1. `01-fullscreen`: `Temporizador limpio a pantalla completa con luciérnagas, tareas y el gato`
2. `02-widgets`: `El temporizador, las tareas y el gato sobre el programa en el que trabajas`
3. `03-timer-settings`: `Cambia el ritmo en un par de clics`
4. `04-fullscreen-daylight`: `El tema claro Daylight`
5. `05-fullscreen-sage`: `El tranquilo tema Sage con temporizador que respira`
6. `06-main-window`: `Tareas con fecha límite, estadísticas y ajustes en la ventana principal`

---

### Italiano (it-IT)

**Descrizione**

```
Firefly Focus è un timer di concentrazione tranquillo che resta con te mentre lavori. Una piccola icona e un timer compatto fluttuano sopra gli altri programmi, così vedi quanto tempo manca senza lasciare quello che stai facendo. E quando non vuoi altro sullo schermo, un clic apre un timer pulito a schermo intero con lucciole che fluttuano.

Un gatto in pixel art ti fa compagnia: passeggia sullo schermo, sbuca da dietro i suoi bordi, insegue una pallina che rimbalza ovunque e fa le fusa quando lo accarezzi. Puoi prendere il gatto o la pallina e lanciarli dove vuoi.

COSA FA
• Sessioni di concentrazione e pause brevi e lunghe in stile Pomodoro, con ritmi già pronti (25/5, 50/10, 52/17, 90/20, 15/3) o il tuo.
• Cambi il ritmo in un paio di clic, direttamente dal widget.
• Attività con scadenze facoltative: quelle scadute diventano rosse, quelle vicine color ambra.
• Scegli cosa mostra il widget: solo il timer, il timer e le attività, oppure anche il gatto.
• Metti via tutto quando vuoi: il timer continua in background e il suo avanzamento si vede sul pulsante della barra delle applicazioni.
• Se ti va, qualche birichinata: attiva il gioco del gatto con le icone del desktop, e si nasconderà dietro, ci salterà sopra e ogni tanto ne morderà una. Un'icona morsa non si apre con il mouse finché non clicchi sul gatto, non lo sposti o non attivi la pallina. Resta disattivato finché non lo attivi. Con una seconda impostazione trascina anche le icone in altri posti, senza toccare i file, e le rimette a posto appena la disattivi o chiudi il programma.
• Un gatto con una vita tutta sua: caccia una lucciola e il puntatore del mouse, e ogni tanto attraversa di corsa tutto lo schermo. Durante una sessione di concentrazione si comporta bene, e quando finisce è contento. Un clic ti mostra tutto ciò che sa fare.
• Statistiche giornaliere e un obiettivo giornaliero.
• Tre temi, tre aspetti del timer, quattro stili sonori e notifiche.
• Sette lingue: italiano, inglese, ucraino, tedesco, spagnolo, slovacco e ceco.

PRIVACY
Nessun account, nessuna pubblicità, nessuna analisi. Il programma non si collega a internet. Attività, impostazioni e statistiche restano sul tuo computer e vengono rimosse quando lo disinstalli.

BUONO A SAPERSI
• I widget e il gatto compaiono sullo schermo principale.
• I tuoi dati restano su questo computer, quindi non si sincronizzano tra dispositivi.
• Chiudendo la finestra principale il timer continua. Per fermarlo, usa «Chiudi il programma e ferma il timer».
```

**Parole chiave:** `pomodoro`, `timer concentrazione`, `produttività`, `timer studio`, `attività`, `sempre in primo piano`, `gatto desktop`

**Didascalie**

1. `01-fullscreen`: `Un timer pulito a schermo intero con lucciole, attività e il gatto`
2. `02-widgets`: `Timer, attività e gatto sopra il programma in cui lavori`
3. `03-timer-settings`: `Cambia il ritmo in un paio di clic`
4. `04-fullscreen-daylight`: `Il tema chiaro Daylight`
5. `05-fullscreen-sage`: `Il tranquillo tema Sage con il timer che respira`
6. `06-main-window`: `Attività con scadenze, statistiche e impostazioni nella finestra principale`

---

### Slovenčina (sk-SK)

**Popis**

```
Firefly Focus je pokojný časovač sústredenia, ktorý je s vami, kým pracujete. Malá ikona a kompaktný časovač plávajú nad ostatnými programami, takže vidíte, koľko času zostáva, bez toho, aby ste od práce odchádzali. A keď nechcete mať na obrazovke nič iné, jedným kliknutím otvoríte čistý časovač na celú obrazovku so svetluškami.

Spoločnosť vám robí pixelová mačka: prechádza sa po obrazovke, vykúka spoza jej okrajov, naháňa skákajúcu loptičku po celej ploche a pradie, keď ju pohladíte. Mačku aj loptičku môžete zdvihnúť a hodiť, kam chcete.

ČO DOKÁŽE
• Sústredenie, krátke a dlhé prestávky v štýle Pomodoro, s hotovými rytmami (25/5, 50/10, 52/17, 90/20, 15/3) alebo vlastným.
• Rytmus zmeníte niekoľkými kliknutiami priamo vo widgete.
• Úlohy s voliteľnými termínmi: po termíne sú červené a tie, čo sa blížia, jantárové.
• Vyberiete si, čo widget ukazuje: iba časovač, časovač a úlohy, alebo aj mačku.
• Všetko môžete odložiť: časovač beží ďalej na pozadí a jeho priebeh vidno na tlačidle na paneli úloh.
• Ak chcete, trochu šibalstva: zapnite hru mačky s ikonami na ploche a bude sa za nimi skrývať, skákať po nich a občas do niektorej zahryzne. Nahryznutá ikona sa myšou neotvorí, kým nekliknete na mačku, neodtiahnete ju alebo nezapnete loptičku. Bez vášho zapnutia to nebude. S druhým nastavením ťahá ikony aj na nové miesta. Súbory to neovplyvní a ikony sa vrátia, hneď ako to vypnete alebo zavriete program.
• Mačka s vlastným životom: poľuje na svetlušku a kurzor myši a občas preletí cez celú obrazovku. Počas sedenia sústredenia sa správa slušne a keď sa skončí, teší sa. Jedno kliknutie ukáže všetko, čo vie.
• Denná štatistika a denný cieľ.
• Tri motívy, tri vzhľady časovača, štyri štýly zvuku a oznámenia.
• Sedem jazykov: slovenčina, angličtina, ukrajinčina, nemčina, španielčina, taliančina a čeština.

SÚKROMIE
Bez účtu, reklám a analýz. Program sa nepripája na internet. Úlohy, nastavenia a štatistiky zostávajú vo vašom počítači a pri odinštalovaní sa odstránia.

DOBRÉ VEDIEŤ
• Widgety a mačka sa zobrazujú na hlavnej obrazovke.
• Údaje zostávajú v tomto počítači, takže sa medzi zariadeniami nesynchronizujú.
• Po zatvorení hlavného okna časovač beží ďalej. Zastavíte ho položkou „Zavrieť program a zastaviť časovač“.
```

**Kľúčové slová:** `pomodoro`, `časovač sústredenia`, `produktivita`, `časovač na učenie`, `úlohy`, `vždy navrchu`, `mačka na ploche`

**Popisy snímok**

1. `01-fullscreen`: `Čistý časovač na celú obrazovku so svetluškami, úlohami a mačkou`
2. `02-widgets`: `Časovač, úlohy a mačka nad programom, v ktorom pracujete`
3. `03-timer-settings`: `Rytmus zmeníte niekoľkými kliknutiami`
4. `04-fullscreen-daylight`: `Svetlý motív Daylight`
5. `05-fullscreen-sage`: `Pokojný motív Sage s dýchajúcim časovačom`
6. `06-main-window`: `Úlohy s termínmi, štatistika a nastavenia v hlavnom okne`

---

### Čeština (cs-CZ)

**Popis**

```
Firefly Focus je klidný časovač soustředění, který je s vámi, zatímco pracujete. Malá ikona a kompaktní časovač plují nad ostatními programy, takže vidíte, kolik času zbývá, aniž byste od práce odcházeli. A když nechcete mít na obrazovce nic jiného, jedním kliknutím otevřete čistý časovač na celou obrazovku se světluškami.

Společnost vám dělá pixelová kočka: prochází se po obrazovce, vykukuje zpoza jejích okrajů, honí skákající míček po celé ploše a přede, když ji pohladíte. Kočku i míček můžete zvednout a hodit, kam chcete.

CO UMÍ
• Soustředění, krátké a dlouhé přestávky ve stylu Pomodoro, s hotovými rytmy (25/5, 50/10, 52/17, 90/20, 15/3) nebo vlastním.
• Rytmus změníte několika kliknutími přímo ve widgetu.
• Úkoly s volitelnými termíny: po termínu jsou červené a ty, které se blíží, jantarové.
• Vyberete si, co widget ukazuje: jen časovač, časovač a úkoly, nebo i kočku.
• Všechno můžete odložit: časovač běží dál na pozadí a jeho průběh je vidět na tlačítku na hlavním panelu.
• Chcete-li, trochu lumpárny: zapněte hru kočky s ikonami na ploše a bude se za nimi schovávat, skákat po nich a občas do některé kousne. Nakousnutá ikona se myší neotevře, dokud nekliknete na kočku, neodtáhnete ji nebo nezapnete míček. Bez vašeho zapnutí se to nestane. S druhým nastavením tahá ikony i na nová místa. Soubory to neovlivní a ikony se vrátí, jakmile to vypnete nebo zavřete program.
• Kočka s vlastním životem: loví světlušku a kurzor myši a občas proletí přes celou obrazovku. Během sezení soustředění se chová slušně a když skončí, raduje se. Jedno kliknutí ukáže všechno, co umí.
• Denní statistika a denní cíl.
• Tři motivy, tři vzhledy časovače, čtyři styly zvuku a oznámení.
• Sedm jazyků: čeština, angličtina, ukrajinština, němčina, španělština, italština a slovenština.

SOUKROMÍ
Bez účtu, reklam a analýz. Program se nepřipojuje k internetu. Úkoly, nastavení a statistiky zůstávají ve vašem počítači a při odinstalaci se odstraní.

DOBRÉ VĚDĚT
• Widgety a kočka se zobrazují na hlavní obrazovce.
• Údaje zůstávají v tomto počítači, takže se mezi zařízeními nesynchronizují.
• Po zavření hlavního okna časovač běží dál. Zastavíte ho položkou „Zavřít program a zastavit časovač“.
```

**Klíčová slova:** `pomodoro`, `časovač soustředění`, `produktivita`, `časovač na učení`, `úkoly`, `vždy navrchu`, `kočka na ploše`

**Popisky snímků**

1. `01-fullscreen`: `Čistý časovač na celou obrazovku se světluškami, úkoly a kočkou`
2. `02-widgets`: `Časovač, úkoly a kočka nad programem, ve kterém pracujete`
3. `03-timer-settings`: `Rytmus změníte několika kliknutími`
4. `04-fullscreen-daylight`: `Světlý motiv Daylight`
5. `05-fullscreen-sage`: `Klidný motiv Sage s dýchajícím časovačem`
6. `06-main-window`: `Úkoly s termíny, statistika a nastavení v hlavním okně`
