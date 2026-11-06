/*
 * Takes the screenshots for the Store listing from the real program, in every
 * language, on throwaway data: npm run screenshots
 * They land in desktop/dist/store-screenshots/<language>/.
 *
 * Only the program's own windows are captured, never the screen itself. "The other
 * program" under the widgets is a plain window drawn here, so nothing of whatever
 * is really open on this computer can get into a picture. The windows do show on
 * the screen for the time this takes.
 */
const { app, BrowserWindow, Notification, screen } = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");

const OUT = path.join(__dirname, "..", "dist", "store-screenshots");
app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "firefly-screenshots-")));
Notification.prototype.show = function show() {};
require(path.join(__dirname, "..", "main.js"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const find = (part) => BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().includes(part));
const js = (win, code) => win.webContents.executeJavaScript(code, true);
const HOST = `document.getElementById("ai-pomodoro-floating-widget-host").shadowRoot`;

async function waitFor(fn, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = await fn();
    if (value) return value;
    await sleep(60);
  }
  throw new Error(`never came true: ${fn}`);
}

const SAMPLE_TASKS = {
  en: ["Finish the quarterly report", "Prepare for Thursday's meeting", "Read chapter 3"],
  uk: ["Дописати квартальний звіт", "Підготуватися до зустрічі в четвер", "Прочитати розділ 3"],
  de: ["Quartalsbericht fertigstellen", "Besprechung am Donnerstag vorbereiten", "Kapitel 3 lesen"],
  es: ["Terminar el informe trimestral", "Preparar la reunión del jueves", "Leer el capítulo 3"],
  it: ["Finire il report trimestrale", "Preparare la riunione di giovedì", "Leggere il capitolo 3"],
  sk: ["Dokončiť štvrťročnú správu", "Pripraviť sa na štvrtkové stretnutie", "Prečítať 3. kapitolu"],
  cs: ["Dokončit čtvrtletní zprávu", "Připravit se na čtvrteční schůzku", "Přečíst 3. kapitolu"],
};

// A window standing in for whatever someone is working in: no words, no real content.
const OTHER_PROGRAM = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><style>
  html, body { margin: 0; height: 100%; background: #e9ebf0; font-family: sans-serif; overflow: hidden; }
  .bar { height: 44px; background: #fff; border-bottom: 1px solid #d5d8e0; }
  .page { box-sizing: border-box; width: 760px; height: calc(100% - 84px); margin: 40px 0 0 150px; padding: 64px 72px; background: #fff; box-shadow: 0 2px 14px rgba(40, 45, 70, .14); }
  .line { height: 11px; margin-bottom: 17px; border-radius: 6px; background: #dfe2ea; }
  .head { height: 22px; width: 56%; margin-bottom: 34px; background: #c5cad8; }
</style><div class="bar"></div><div class="page"><div class="line head"></div>
${[92, 100, 96, 88, 40, 0, 100, 94, 98, 90, 72, 0, 96, 100, 84, 92, 36].map((w) => `<div class="line" style="width:${w}%;${w ? "" : "background:none"}"></div>`).join("")}</div>`)}`;

/* ---------- Pictures: premultiplied BGRA, as the program's captures come ---------- */

function picture(width, height, paint) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const [b, g, r] = paint(y / (height - 1));
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      pixels[at] = b;
      pixels[at + 1] = g;
      pixels[at + 2] = r;
      pixels[at + 3] = 255;
    }
  }
  return { width, height, pixels };
}

function fromCapture(image) {
  const { width, height } = image.getSize();
  return { width, height, pixels: image.toBitmap() };
}

function lay(base, top, left, upper) {
  for (let y = Math.max(0, -upper); y < top.height && y + upper < base.height; y += 1) {
    for (let x = Math.max(0, -left); x < top.width && x + left < base.width; x += 1) {
      const from = (y * top.width + x) * 4;
      const to = ((y + upper) * base.width + x + left) * 4;
      const keep = 255 - top.pixels[from + 3];
      for (let c = 0; c < 4; c += 1) {
        base.pixels[to + c] = top.pixels[from + c] + Math.round((base.pixels[to + c] * keep) / 255);
      }
    }
  }
  return base;
}

function save(language, name, { width, height, pixels }) {
  const { nativeImage } = require("electron");
  const folder = path.join(OUT, language);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, `${name}.png`), nativeImage.createFromBitmap(pixels, { width, height }).toPNG());
}

app.whenReady().then(async () => {
  const main = await waitFor(() => find("sidepanel.html"));
  const engine = find("engine.html");
  await waitFor(() => main.isVisible() && find("overlay.html") && find("launcher.html"));
  engine.webContents.setAudioMuted(true);
  await sleep(1500);

  const scale = screen.getPrimaryDisplay().scaleFactor;
  const area = screen.getPrimaryDisplay().workArea;
  const width = Math.round(area.width * scale);
  const height = Math.round(area.height * scale);

  const send = (message) => js(engine, `chrome.runtime.sendMessage(${JSON.stringify(message)}).then((r) => r.state)`);
  const settings = async (changes) => {
    const state = await send({ type: "GET_STATE" });
    return send({ type: "SAVE_SETTINGS", settings: { ...state.settings, ...changes } });
  };
  const store = (items) => js(engine, `chrome.storage.local.set(${JSON.stringify(items)}).then(() => true)`);

  // A window not drawn yet cannot be captured, and says so with an error.
  async function grab(win) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return fromCapture(await win.webContents.capturePage());
      } catch (error) {
        if (attempt === 8) throw new Error(`cannot capture ${win.webContents.getURL().slice(0, 60)}: ${error}`);
        win.webContents.invalidate();
        await sleep(300);
      }
    }
  }

  // Keeps a window in front long enough to be drawn, whatever else is open.
  async function capture(win) {
    const wasOnTop = win.isAlwaysOnTop();
    win.setAlwaysOnTop(true, wasOnTop ? "screen-saver" : "normal");
    win.moveTop();
    await sleep(350);
    const image = await grab(win);
    if (!wasOnTop) win.setAlwaysOnTop(false);
    return image;
  }

  // Part-way through a stage, with a good day behind it, so nothing looks empty.
  async function stage() {
    const state = await send({ type: "GET_STATE" });
    await store({
      pomodoro: {
        ...state,
        mode: "work",
        running: true,
        endsAt: Date.now() + (18 * 60 + 42) * 1000,
        stats: { ...state.stats, sessionsToday: 3, focusMsToday: 75 * 60000, totalSessions: 41 },
      },
    });
    await sleep(300);
  }

  async function fullscreenShot(language, name) {
    await js(main, `document.getElementById("fullscreenBtn").click(); true`);
    const full = await waitFor(() => find("fullscreen.html"));
    await sleep(2600);
    save(language, name, await capture(full));
    full.close();
    await waitFor(() => !find("fullscreen.html"));
    await sleep(500);
  }

  async function layerShot(language, name, other, prepare) {
    const layer = await waitFor(() => find("overlay.html")?.isVisible() && find("overlay.html"));
    await waitFor(() => js(layer, `Boolean(${HOST}.querySelector(".buddy-hit"))`).catch(() => false));
    if (prepare) await prepare(layer);
    await sleep(prepare ? 700 : 2500);
    const base = await capture(other);
    lay(base, await grab(layer), 0, 0);
    const icon = find("launcher.html");
    if (icon) {
      const at = icon.getBounds();
      lay(base, await grab(icon), Math.round((at.x - area.x) * scale), Math.round((at.y - area.y) * scale));
    }
    save(language, name, base);
  }

  await store({ pomodoroBuddyMode: "roam", desktopLauncherPosition: { x: area.x + area.width - 84, y: area.y + 24 } });

  const languages = (process.env.SHOT_LANGUAGES || Object.keys(SAMPLE_TASKS).join()).split(",");
  for (const language of languages) {
    let state = await settings({
      language,
      theme: "midnight",
      timerFace: "ring",
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesBeforeLong: 4,
      notificationsEnabled: false,
      soundEnabled: false,
      floatingWidgetEnabled: true,
      studyBuddyEnabled: true,
      widgetMode: "full",
    });
    for (const task of state.tasks) state = await send({ type: "DELETE_TASK", id: task.id });
    const soon = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const later = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);
    const latest = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
    for (const [i, text] of SAMPLE_TASKS[language].entries()) {
      await send({ type: "ADD_TASK", text, deadline: [soon, later, latest][i] });
    }
    await store({ desktopWidgetKind: "full" });
    await stage();

    // The widgets and the icon over another program.
    main.minimize();
    const other = new BrowserWindow({ ...area, frame: false, skipTaskbar: true, show: true, webPreferences: { spellcheck: false } });
    await other.loadURL(OTHER_PROGRAM);
    await store({ pomodoroFloatingPosition: { x: area.width - 330, y: 96 }, pomodoroBuddyPosition: { x: area.width - 300, y: area.height - 220 } });
    await sleep(600);
    await layerShot(language, "02-widgets", other);
    await layerShot(language, "03-timer-settings", other, async (layer) => {
      await js(layer, `${HOST}.querySelector(".edge-quick").click(); true`);
    });
    await js(find("overlay.html"), `${HOST}.querySelector(".edge-quick").click(); true`);
    other.destroy();

    // The fullscreen timer, as it is, in each of the themes.
    main.restore();
    await sleep(300);
    await fullscreenShot(language, "01-fullscreen");
    await stage();
    await settings({ theme: "daylight" });
    await fullscreenShot(language, "04-fullscreen-daylight");
    await stage();
    await settings({ theme: "sage", timerFace: "breathe" });
    await fullscreenShot(language, "05-fullscreen-sage");
    await stage();

    // The main window, top and further down, side by side.
    await settings({ theme: "midnight", timerFace: "ring", floatingWidgetEnabled: false });
    await store({ desktopLauncherHidden: true });
    await sleep(900);
    main.setSize(480, Math.min(860, area.height));
    await js(main, `document.scrollingElement.scrollTop = 0; true`);
    // Under the fullscreen window it has not been drawing: bring it round first.
    main.show();
    main.focus();
    main.setAlwaysOnTop(true, "normal");
    main.webContents.invalidate();
    await sleep(1800);
    await stage();
    await sleep(900);
    const top = await capture(main);
    await js(main, `document.querySelector(".tasks-card").scrollIntoView({ block: "start" }); true`);
    await sleep(500);
    const lower = await capture(main);
    await js(main, `document.scrollingElement.scrollTop = 0; true`);
    main.setAlwaysOnTop(false);
    const sheet = picture(width, height, (t) => [Math.round(92 - 40 * t), Math.round(36 - 16 * t), Math.round(78 - 34 * t)]);
    const gap = Math.round(48 * scale);
    const left = Math.round((width - top.width * 2 - gap) / 2);
    const upper = Math.round((height - top.height) / 2);
    lay(sheet, top, left, upper);
    lay(sheet, lower, left + top.width + gap, upper);
    save(language, "06-main-window", sheet);
    await settings({ floatingWidgetEnabled: true });
    await store({ desktopLauncherHidden: false });
    await waitFor(() => find("overlay.html")?.isVisible() && find("launcher.html")?.isVisible());
    console.log(`${language} done`);
  }

  app.exit(0);
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
