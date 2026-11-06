/*
 * Firefly Focus as a Windows program.
 *
 * Like the installable app, it is not a rewrite. It runs the extension's own
 * pages and timer on top of an adapter, desktop/shim.js, and this file is the
 * part a browser would otherwise be: it serves those files, keeps the data,
 * passes messages between windows and owns the windows themselves.
 *
 *   engine     hidden, always there: service_worker.js and offscreen.js, so
 *              the timer and its sounds carry on with every other window shut
 *   main       sidepanel.html in an ordinary window; the side panel itself
 *              does not exist outside a browser
 *   fullscreen fullscreen.html, unchanged
 *   overlay    a see-through layer over everything, where the cat wanders
 */
const {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  ipcMain,
  nativeImage,
  protocol,
  screen,
  session,
} = require("electron");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCHEME = "firefly";
const pageUrl = (page) => `${SCHEME}://app/${page}`;
const PRELOAD = path.join(__dirname, "preload.js");
const ICON = path.join(ROOT, "icon128.png");

// For measuring: where to write the samples, and when to hide the layer and quit.
const METRICS_FILE = process.env.FIREFLY_METRICS || null;
const HIDE_AFTER_MS = Number(process.env.FIREFLY_HIDE_AFTER_MS) || 0;
const QUIT_AFTER_MS = Number(process.env.FIREFLY_QUIT_AFTER_MS) || 0;

// The program's own words; the pages bring theirs in shared.js.
const WORDS = {
  uk: { open: "Відкрити Firefly Focus", cat: "Показати або сховати кота", quit: "Завершити роботу", hintTitle: "Firefly Focus працює далі", hint: "Вікно сховано, програма працює у фоні. Завершити роботу можна через значок біля годинника." },
  en: { open: "Open Firefly Focus", cat: "Show or hide the cat", quit: "Quit", hintTitle: "Firefly Focus keeps running", hint: "The window is hidden and the program keeps running. To quit, use the icon by the clock." },
  de: { open: "Firefly Focus öffnen", cat: "Katze ein- oder ausblenden", quit: "Beenden", hintTitle: "Firefly Focus läuft weiter", hint: "Das Fenster ist ausgeblendet, das Programm läuft weiter. Zum Beenden das Symbol neben der Uhr verwenden." },
  es: { open: "Abrir Firefly Focus", cat: "Mostrar u ocultar el gato", quit: "Salir", hintTitle: "Firefly Focus sigue en marcha", hint: "La ventana está oculta y el programa sigue en marcha. Para salir, usa el icono junto al reloj." },
  it: { open: "Apri Firefly Focus", cat: "Mostra o nascondi il gatto", quit: "Esci", hintTitle: "Firefly Focus resta attivo", hint: "La finestra è nascosta e il programma resta attivo. Per uscire, usa l'icona accanto all'orologio." },
  sk: { open: "Otvoriť Firefly Focus", cat: "Zobraziť alebo skryť mačku", quit: "Ukončiť", hintTitle: "Firefly Focus beží ďalej", hint: "Okno je skryté a program beží ďalej. Ukončiť ho môžeš cez ikonu pri hodinách." },
  cs: { open: "Otevřít Firefly Focus", cat: "Zobrazit nebo skrýt kočku", quit: "Ukončit", hintTitle: "Firefly Focus běží dál", hint: "Okno je skryté a program běží dál. Ukončit ho můžeš přes ikonu u hodin." },
};

let engine = null;
let mainWindow = null;
let fullscreenWindow = null;
let overlay = null;
let tray = null;
let quitting = false;

// Left alone, Chromium looks around the local network for a proxy ("wpad").
// This has to be set before the app is ready, as does the scheme.
app.commandLine.appendSwitch("no-proxy-server");
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/* ---------- Local only ---------- */

/*
 * The program is local: nothing it loads may come from anywhere but its own
 * files. Everything else is refused here, whatever asks for it.
 */
function refuseTheNetwork() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !/^(firefly|data|blob|devtools):/.test(details.url) });
  });
  app.on("web-contents-created", (_event, contents) => {
    contents.on("will-navigate", (event) => event.preventDefault());
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
  });
}

/* ---------- Serving the files ---------- */

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const POLICY = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'";

/*
 * The extension's pages come as they are, with the adapter put in front of
 * their scripts and the app's window layout after their styles: nothing in
 * sidepanel.html or fullscreen.html has to know where it is running. Pages of
 * desktop/ load what they need themselves.
 */
function adaptPage(html) {
  return html
    .replace("<head>", '<head>\n  <script src="/desktop/shim.js"></script>')
    .replace("</head>", '  <link rel="stylesheet" href="/app/app.css" />\n</head>')
    .replace(/<body([^>]*?)class="([^"]*)"/, '<body$1class="$2 is-app"')
    .replace(/<body(?![^>]*class=)([^>]*)>/, '<body class="is-app"$1>');
}

function serveFiles() {
  session.defaultSession.protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
    const type = CONTENT_TYPES[path.extname(file).toLowerCase()];
    if (!type || !file.startsWith(ROOT + path.sep)) return new Response(null, { status: 404 });
    try {
      let body = await fs.promises.readFile(file);
      if (path.extname(file) === ".html" && path.dirname(file) === ROOT) body = adaptPage(body.toString("utf8"));
      return new Response(body, { headers: { "content-type": type, "content-security-policy": POLICY } });
    } catch (error) {
      return new Response(null, { status: 404 });
    }
  });
}

/* ---------- The data: chrome.storage.local, in one file ---------- */

let store = {};
let saveTimer = null;
const storeFile = () => path.join(app.getPath("userData"), "firefly-focus.json");

function loadStore() {
  try {
    store = JSON.parse(fs.readFileSync(storeFile(), "utf8"));
  } catch (error) {
    // No file yet is normal. One that cannot be read is kept aside, not lost.
    if (error.code !== "ENOENT") fs.renameSync(storeFile(), `${storeFile()}.unreadable`);
    store = {};
  }
}

/* Written beside the old file and then swapped in, so a crash cannot leave half of it. */
function saveStoreNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  fs.writeFileSync(`${storeFile()}.tmp`, JSON.stringify(store));
  fs.renameSync(`${storeFile()}.tmp`, storeFile());
}

function setStored(items) {
  if (quitting) return; // the timer has been stopped for good: nothing may write over that
  const changes = {};
  for (const [key, value] of Object.entries(items)) {
    changes[key] = { oldValue: store[key], newValue: value };
    store[key] = value;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStoreNow, 200);
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send("storage-changed", changes);
  if (changes.pomodoro?.oldValue?.settings?.language !== changes.pomodoro?.newValue?.settings?.language) buildTrayMenu();
}

function getStored(query) {
  if (query === null || query === undefined) return { ...store };
  const keys = typeof query === "string" ? [query] : Array.isArray(query) ? query : Object.keys(query);
  const defaults = typeof query === "object" && !Array.isArray(query) ? query : {};
  return Object.fromEntries(keys.map((key) => [key, key in store ? store[key] : defaults[key]]));
}

const words = () => WORDS[store.pomodoro?.settings?.language] || WORDS.uk;

/* ---------- The engine, and messages to it ---------- */

let engineReady = false;
let requests = 0;
const waiting = new Map();
const unsent = [];

function createEngine() {
  engineReady = false;
  engine = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: PRELOAD,
      spellcheck: false,
      // Hidden for good, and it still has to ring on time.
      backgroundThrottling: false,
    },
  });
  engine.webContents.on("render-process-gone", () => {
    // Everything it knows is in the store: a new one picks the timer up from there.
    if (quitting) return;
    for (const answer of waiting.values()) answer({ ok: false, error: "engine restarted" });
    waiting.clear();
    engine.destroy();
    createEngine();
  });
  engine.loadURL(pageUrl("desktop/engine.html"));
}

function askEngine(message) {
  return new Promise((resolve) => {
    requests += 1;
    waiting.set(requests, resolve);
    if (engineReady) engine.webContents.send("engine-request", requests, message);
    else unsent.push([requests, message]);
  });
}

/* ---------- Windows ---------- */

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 860,
    minWidth: 340,
    minHeight: 480,
    show: false,
    title: "Firefly Focus",
    icon: ICON,
    backgroundColor: "#210635",
    webPreferences: { preload: PRELOAD, spellcheck: false },
  });
  // Shutting the window only hides it: the timer is meant to carry on. Quitting
  // is a separate, deliberate step, and the first time, it says so.
  mainWindow.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.hide();
    if (!store.desktopCloseHintShown) {
      setStored({ desktopCloseHintShown: true });
      new Notification({ title: words().hintTitle, body: words().hint, icon: ICON }).show();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  for (const change of ["show", "hide", "minimize", "restore"]) mainWindow.on(change, updateCat);
  mainWindow.loadURL(pageUrl("sidepanel.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

/*
 * The page has its own button for going in and out of fullscreen, so it asks
 * for fullscreen itself rather than the window starting out that way: that
 * button, and Esc, then work as they do in a browser tab.
 */
function openFullscreen() {
  if (fullscreenWindow) {
    fullscreenWindow.show();
    fullscreenWindow.focus();
    return;
  }
  fullscreenWindow = new BrowserWindow({
    show: false,
    title: "Firefly Focus",
    icon: ICON,
    backgroundColor: "#210635",
    webPreferences: { preload: PRELOAD, spellcheck: false },
  });
  fullscreenWindow.on("closed", () => {
    fullscreenWindow = null;
    updateCat();
  });
  fullscreenWindow.once("ready-to-show", () => {
    fullscreenWindow.maximize();
    fullscreenWindow.show();
    fullscreenWindow.webContents.executeJavaScript("document.documentElement.requestFullscreen().catch(() => {})", true);
  });
  fullscreenWindow.loadURL(pageUrl("fullscreen.html"));
  updateCat();
}

/*
 * The work area, not the whole screen: the taskbar stays reachable, and a
 * topmost window covering the entire display would have Windows treat it as a
 * fullscreen program and hold back notifications.
 */
function createOverlay() {
  const { workArea } = screen.getPrimaryDisplay();
  overlay = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false, // working in another program, it never takes the focus
    show: false,
    webPreferences: { preload: PRELOAD, spellcheck: false },
  });
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setIgnoreMouseEvents(true, { forward: true });
  // Closing destroys the window while timers and messages may still reach for it.
  overlay.on("closed", () => {
    overlay = null;
  });
  overlay.loadURL(pageUrl("desktop/overlay.html"));
}

/*
 * One cat at a time. The main window and the fullscreen timer each have their
 * own, so the one on the layer comes out only when neither is in front of you.
 */
function updateCat() {
  if (!overlay) return;
  const mainShowing = mainWindow?.isVisible() && !mainWindow.isMinimized();
  const wanted = !store.desktopCatHidden && !mainShowing && !fullscreenWindow;
  if (wanted && !overlay.isVisible()) overlay.showInactive();
  if (!wanted && overlay.isVisible()) overlay.hide();
}

/* ---------- Tray ---------- */

function buildTrayMenu() {
  if (!tray) return;
  const say = words();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: say.open, click: showMainWindow },
    {
      label: say.cat,
      click: () => {
        setStored({ desktopCatHidden: !store.desktopCatHidden });
        updateCat();
      },
    },
    { type: "separator" },
    { label: say.quit, click: () => app.quit() },
  ]));
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(ROOT, "icon32.png")));
  tray.setToolTip("Firefly Focus");
  tray.on("click", showMainWindow);
  buildTrayMenu();
}

/* ---------- Quitting ---------- */

/*
 * Quitting ends the timer. Left marked as running, the next start would take
 * the time away as a missed stage and ring for it, so it is paused here, in the
 * data, with no sound and no notification. A crash or a shutdown does not come
 * through here, and that one really is a stage missed: it is caught up on.
 */
function stopTheTimer() {
  const state = store.pomodoro;
  if (!state?.running) return;
  store.pomodoro = { ...state, running: false, endsAt: null, remainingMs: Math.max(0, state.endsAt - Date.now()) };
}

/* ---------- Measuring ---------- */

function measure() {
  if (!METRICS_FILE) return;
  const started = Date.now();
  setInterval(() => {
    if (!overlay) return;
    const processes = app.getAppMetrics();
    const sample = {
      t: Math.round((Date.now() - started) / 1000),
      visible: overlay.isVisible(),
      cpu: processes.reduce((sum, p) => sum + p.cpu.percentCPUUsage, 0),
      ramMb: processes.reduce((sum, p) => sum + p.memory.workingSetSize, 0) / 1024,
      byType: processes.map((p) => ({
        type: p.type,
        pid: p.pid,
        cpu: p.cpu.percentCPUUsage,
        ramMb: p.memory.workingSetSize / 1024,
      })),
    };
    fs.appendFileSync(METRICS_FILE, `${JSON.stringify(sample)}\n`);
  }, 5000);
  if (HIDE_AFTER_MS) setTimeout(() => overlay?.hide(), HIDE_AFTER_MS);
  if (QUIT_AFTER_MS) setTimeout(() => app.quit(), QUIT_AFTER_MS);
}

/* ---------- Start ---------- */

function listen() {
  ipcMain.handle("storage-get", (_event, query) => getStored(query));
  ipcMain.handle("storage-set", (_event, items) => setStored(items));
  ipcMain.handle("storage-remove", (_event, keys) => {
    for (const key of [].concat(keys)) delete store[key];
    saveStoreNow();
  });

  ipcMain.handle("message", (_event, message) => {
    if (message?.type === "OPEN_SIDE_PANEL") showMainWindow();
    return askEngine(message);
  });
  ipcMain.on("engine-ready", () => {
    engineReady = true;
    for (const [id, message] of unsent.splice(0)) engine.webContents.send("engine-request", id, message);
  });
  ipcMain.on("engine-reply", (_event, id, value) => {
    waiting.get(id)?.(value);
    waiting.delete(id);
  });

  ipcMain.on("notify", (_event, { title, message }) => {
    const notification = new Notification({ title, body: message, icon: ICON });
    notification.on("click", showMainWindow);
    notification.show();
  });
  ipcMain.on("badge", (_event, text) => {
    tray?.setToolTip(text ? `Firefly Focus · ${text}` : "Firefly Focus");
  });
  ipcMain.on("open-fullscreen", openFullscreen);

  // The layer asks to take the mouse only while the pointer is over the cat.
  ipcMain.on("click-through", (_event, through) => {
    overlay?.setIgnoreMouseEvents(through, { forward: true });
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let loaded = false;
  app.setAppUserModelId("com.sinnaint.fireflyfocus");
  app.on("second-instance", showMainWindow);
  app.on("before-quit", () => {
    // Quit before the data was even read, there is nothing to save, and
    // saving would write an empty file over it.
    if (quitting || !loaded) return;
    stopTheTimer();
    saveStoreNow();
    quitting = true;
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    loadStore();
    loaded = true;
    refuseTheNetwork();
    serveFiles();
    listen();
    createEngine();
    createOverlay();
    createMainWindow();
    createTray();
    measure();
  });
}
