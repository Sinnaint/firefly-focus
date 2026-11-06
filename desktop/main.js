/*
 * Firefly Focus as a Windows program — prototype.
 *
 * This answers one question before anything else is built on it: can the cat
 * walk over every other program on a see-through layer, with clicks falling
 * through to whatever is underneath, cheaply enough to leave running all day?
 *
 * So there is only the layer and a tray icon to close it with. The timer and
 * the windows come once the answer is yes.
 */
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, session } = require("electron");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// For measuring: where to write the samples, and when to hide the layer and quit.
const METRICS_FILE = process.env.FIREFLY_METRICS || null;
const HIDE_AFTER_MS = Number(process.env.FIREFLY_HIDE_AFTER_MS) || 0;
const QUIT_AFTER_MS = Number(process.env.FIREFLY_QUIT_AFTER_MS) || 0;

let overlay = null;
let tray = null;

// Left alone, Chromium looks around the local network for a proxy ("wpad").
// This has to be set before the app is ready.
app.commandLine.appendSwitch("no-proxy-server");

/*
 * The program is local: nothing it loads may come from anywhere but its own
 * files. Everything else is refused here, whatever asks for it.
 */
function refuseTheNetwork() {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !/^(file|data|blob|devtools):/.test(details.url) });
  });
  app.on("web-contents-created", (_event, contents) => {
    contents.on("will-navigate", (event) => event.preventDefault());
    contents.setWindowOpenHandler(() => ({ action: "deny" }));
  });
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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      spellcheck: false, // Chromium would fetch its dictionaries from the net
    },
  });
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.setIgnoreMouseEvents(true, { forward: true });
  // Closing destroys the window while timers and messages may still reach for it.
  overlay.on("closed", () => {
    overlay = null;
  });
  overlay.loadFile(path.join(__dirname, "overlay.html"));
  overlay.once("ready-to-show", () => overlay.showInactive());
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(ROOT, "icon32.png")));
  tray.setToolTip("Firefly Focus");
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Show or hide the cat",
      click: () => (overlay?.isVisible() ? overlay.hide() : overlay?.showInactive()),
    },
    { label: "Close", click: () => app.quit() },
  ]));
}

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

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // The layer asks to take the mouse only while the pointer is over the cat.
  ipcMain.on("click-through", (_event, through) => {
    overlay?.setIgnoreMouseEvents(through, { forward: true });
  });

  app.whenReady().then(() => {
    refuseTheNetwork();
    createOverlay();
    createTray();
    measure();
  });
}
