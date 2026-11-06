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
 *   overlay    a see-through layer over everything, with floating_widget.js on
 *              it; shut, not just hidden, while it is not wanted
 *   launcher   the small icon over everything, showing how far the timer has got
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
const WORDS = require("./words.js");

const ROOT = path.join(__dirname, "..");
const SCHEME = "firefly";
const pageUrl = (page) => `${SCHEME}://app/${page}`;
const PRELOAD = path.join(__dirname, "preload.js");
const ICON = path.join(ROOT, "icon128.png");
const LAUNCHER_SIZE = 60;

let engine = null;
let mainWindow = null;
let fullscreenWindow = null;
let overlay = null;
let overlayKind = null;
let launcher = null;
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

// The settings only the program has; see panel.js. Their words are in words.js.
const PROGRAM_SETTINGS = `<div class="settings-grid desktop-settings">
        <label class="full">
          <span data-i18n="desktopWidgetKindLabel"></span>
          <select id="desktopWidgetKind">
            <option value="timer" data-i18n="desktopKindTimer"></option>
            <option value="tasks" data-i18n="desktopKindTasks"></option>
            <option value="full" data-i18n="desktopKindFull"></option>
          </select>
        </label>
      </div>
      <div class="toggles desktop-toggles">
        <label>
          <input id="desktopLauncherShown" type="checkbox" />
          <span data-i18n="desktopLauncherLabel"></span>
        </label>
      </div>

      `;
const QUIT_BUTTON = '\n      <button id="desktopQuit" type="button" data-i18n="desktopQuit"></button>';

/*
 * The extension's pages come as they are, with the adapter put in front of
 * their scripts, the app's window layout after their styles and the program's
 * own additions beside them: nothing in sidepanel.html or fullscreen.html has to
 * know where it is running. Pages of desktop/ load what they need themselves.
 */
function adaptPage(html) {
  return html
    .replace("<head>", '<head>\n  <script src="/desktop/shim.js"></script>')
    .replace("</head>", '  <link rel="stylesheet" href="/app/app.css" />\n  <link rel="stylesheet" href="/desktop/panel.css" />\n</head>')
    .replace(/<body([^>]*?)class="([^"]*)"/, '<body$1class="$2 is-app"')
    .replace(/<body(?![^>]*class=)([^>]*)>/, '<body class="is-app"$1>')
    .replace('<script src="shared.js"></script>', '<script src="shared.js"></script>\n  <script src="/desktop/words.js"></script>\n  <script src="/desktop/panel.js"></script>')
    .replace('<button id="saveBtn"', `${PROGRAM_SETTINGS}<button id="saveBtn"`)
    .replace(/(<button id="saveBtn"[^]*?<\/button>)/, `$1${QUIT_BUTTON}`);
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
  updateScreen();
}

function getStored(query) {
  if (query === null || query === undefined) return { ...store };
  const keys = typeof query === "string" ? [query] : Array.isArray(query) ? query : Object.keys(query);
  const defaults = typeof query === "object" && !Array.isArray(query) ? query : {};
  return Object.fromEntries(keys.map((key) => [key, key in store ? store[key] : defaults[key]]));
}

const words = () => (WORDS[store.pomodoro?.settings?.language] || WORDS.uk).program;

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
  // Shutting the window only minimizes it: the timer is meant to carry on, and
  // the taskbar button stays, whatever else has been taken off the screen.
  // Quitting is a separate, deliberate step, and the first time, it says so.
  mainWindow.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    mainWindow.minimize();
    if (!store.desktopCloseHintShown) {
      setStored({ desktopCloseHintShown: true });
      new Notification({ title: words().hintTitle, body: words().hint, icon: ICON }).show();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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
    updateScreen();
  });
  fullscreenWindow.once("ready-to-show", () => {
    fullscreenWindow.maximize();
    fullscreenWindow.show();
    fullscreenWindow.webContents.executeJavaScript("document.documentElement.requestFullscreen().catch(() => {})", true);
  });
  fullscreenWindow.loadURL(pageUrl("fullscreen.html"));
  updateScreen();
}

/*
 * The work area, not the whole screen: the taskbar stays reachable, and a
 * topmost window covering the entire display would have Windows treat it as a
 * fullscreen program and hold back notifications.
 */
function createOverlay(kind) {
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
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
  win.setAlwaysOnTop(true, "screen-saver");
  win.setIgnoreMouseEvents(true, { forward: true });
  // Closing destroys the window while timers and messages may still reach for it.
  win.on("closed", () => {
    if (overlay === win) overlay = null;
  });
  win.once("ready-to-show", () => {
    win.showInactive();
    launcher?.moveTop();
  });
  overlay = win;
  overlayKind = kind;
  win.loadURL(pageUrl(`desktop/overlay.html?kind=${kind}`));
}

function keepOnScreen({ x, y }) {
  const { workArea } = screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) });
  return {
    x: Math.round(Math.min(Math.max(workArea.x, x), workArea.x + workArea.width - LAUNCHER_SIZE)),
    y: Math.round(Math.min(Math.max(workArea.y, y), workArea.y + workArea.height - LAUNCHER_SIZE)),
  };
}

/* Where the icon goes: where it was left, if that is still on a screen. */
function launcherSpot() {
  if (store.desktopLauncherPosition) return keepOnScreen(store.desktopLauncherPosition);
  const { workArea } = screen.getPrimaryDisplay();
  return { x: workArea.x + workArea.width - LAUNCHER_SIZE - 24, y: workArea.y + 24 };
}

function createLauncher() {
  const bounds = { ...launcherSpot(), width: LAUNCHER_SIZE, height: LAUNCHER_SIZE };
  const win = new BrowserWindow({
    ...bounds,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    hasShadow: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: { preload: PRELOAD, spellcheck: false },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.on("closed", () => {
    if (launcher === win) launcher = null;
  });
  // On a scaled screen a see-through window comes out a little larger than asked,
  // and would shrink at the first drag.
  win.once("ready-to-show", () => {
    win.setBounds(bounds);
    win.showInactive();
  });
  launcher = win;
  win.loadURL(pageUrl("desktop/launcher.html"));
}

const widgetsWanted = () => store.pomodoro?.settings?.floatingWidgetEnabled !== false;

/*
 * Every "should this be on the screen?" is answered here, from the data, each
 * time the data changes. The layer and the icon are shut rather than hidden, to
 * give their memory back. The fullscreen timer has a cat and a clock of its own
 * and is meant to stay clean, so both step aside for it.
 */
function updateScreen() {
  if (quitting) return;
  const free = !fullscreenWindow;
  const kind = store.desktopWidgetKind || "full";

  if (overlay && (!free || !widgetsWanted() || kind !== overlayKind)) {
    const old = overlay;
    overlay = null;
    old.destroy();
  }
  if (!overlay && free && widgetsWanted()) createOverlay(kind);

  const launcherWanted = free && !store.desktopLauncherHidden;
  if (launcher && !launcherWanted) {
    const old = launcher;
    launcher = null;
    old.destroy();
  }
  if (!launcher && launcherWanted) createLauncher();

  updateTrayMenu();
  showProgressOnTaskbar();
}

function setWidgets(wanted) {
  const settings = store.pomodoro?.settings;
  if (settings && widgetsWanted() !== wanted) {
    askEngine({ type: "SAVE_SETTINGS", settings: { ...settings, floatingWidgetEnabled: wanted } });
  }
}

/* The timer on the taskbar button: all that is left once everything else is put away. */
function showProgressOnTaskbar() {
  const state = store.pomodoro;
  if (!mainWindow || !state?.settings) return;
  const minutes = {
    work: state.settings.workMinutes,
    shortBreak: state.settings.shortBreakMinutes,
    longBreak: state.settings.longBreakMinutes,
  }[state.mode];
  const total = minutes * 60000;
  const left = state.running ? state.endsAt - Date.now() : state.remainingMs ?? total;
  const done = Math.min(1, Math.max(0, 1 - left / total));
  if (state.running) mainWindow.setProgressBar(done);
  else if (done > 0) mainWindow.setProgressBar(done, { mode: "paused" });
  else mainWindow.setProgressBar(-1);
}

/* ---------- Menu and tray ---------- */

/* The same menu on the tray icon and on the small icon on the screen. */
function programMenu() {
  const say = words();
  return Menu.buildFromTemplate([
    { label: say.open, click: showMainWindow },
    { label: say.widgets, type: "checkbox", checked: widgetsWanted(), click: () => setWidgets(!widgetsWanted()) },
    {
      label: say.launcher,
      type: "checkbox",
      checked: !store.desktopLauncherHidden,
      click: () => setStored({ desktopLauncherHidden: !store.desktopLauncherHidden }),
    },
    { type: "separator" },
    { label: say.quit, click: () => app.quit() },
  ]);
}

let trayMenuFor = "";

function updateTrayMenu() {
  if (!tray) return;
  const now = [store.pomodoro?.settings?.language, widgetsWanted(), store.desktopLauncherHidden].join();
  if (now === trayMenuFor) return;
  trayMenuFor = now;
  tray.setContextMenu(programMenu());
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(ROOT, "icon32.png")));
  tray.setToolTip("Firefly Focus");
  tray.on("click", showMainWindow);
  updateTrayMenu();
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

/* ---------- Start ---------- */

function listen() {
  ipcMain.handle("storage-get", (_event, query) => getStored(query));
  ipcMain.handle("storage-set", (_event, items) => setStored(items));
  ipcMain.handle("storage-remove", (_event, keys) => {
    for (const key of [].concat(keys)) delete store[key];
    saveStoreNow();
  });

  ipcMain.handle("message", (event, message) => {
    // The widget's way on is the whole screen. Everywhere else, the main window.
    if (message?.type === "OPEN_SIDE_PANEL") {
      if (overlay && event.sender === overlay.webContents) openFullscreen();
      else showMainWindow();
    }
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
  ipcMain.on("quit", () => app.quit());

  // The layer takes the mouse only while the pointer is over the widget or the cat.
  ipcMain.on("click-through", (_event, through) => {
    overlay?.setIgnoreMouseEvents(through, { forward: true });
  });
  // And the keyboard only while something on it is being typed into. Becoming
  // focusable also puts a window on the taskbar, which this one never should be.
  ipcMain.on("take-keyboard", (_event, wanted) => {
    if (!overlay) return;
    if (wanted) {
      overlay.setFocusable(true);
      overlay.setSkipTaskbar(true);
      overlay.focus();
    } else {
      overlay.blur();
      overlay.setFocusable(false);
    }
  });
  ipcMain.on("close-widgets", () => setWidgets(false));

  ipcMain.on("launcher-click", () => setWidgets(!widgetsWanted()));
  ipcMain.on("launcher-move", (_event, x, y) => {
    // The size each time: moving a see-through window can grow it on a scaled screen.
    launcher?.setBounds({ ...keepOnScreen({ x, y }), width: LAUNCHER_SIZE, height: LAUNCHER_SIZE });
  });
  ipcMain.on("launcher-moved", () => {
    if (!launcher) return;
    const { x, y } = launcher.getBounds();
    setStored({ desktopLauncherPosition: { x, y } });
  });
  ipcMain.on("launcher-menu", () => {
    if (launcher) programMenu().popup({ window: launcher });
  });

  screen.on("display-metrics-changed", () => {
    overlay?.setBounds(screen.getPrimaryDisplay().workArea);
  });
  setInterval(showProgressOnTaskbar, 5000);
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
    // Out on the screen the cat wanders from the start. Websites start it on its shelf.
    store.pomodoroBuddyMode ??= "roam";
    refuseTheNetwork();
    serveFiles();
    listen();
    createEngine();
    createMainWindow();
    createTray();
    updateScreen();
  });
}
