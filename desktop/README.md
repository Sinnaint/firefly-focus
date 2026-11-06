# Firefly Focus for Windows

The Windows program, built on Electron. It runs the timer and the pages in the repository's root, `service_worker.js`, `offscreen.js`, `sidepanel.html`, `fullscreen.html`, `floating_widget.js` and `buddy.js`, with no copies of them here. This folder holds what runs around them.

| File | What it does |
|---|---|
| `main.js` | The part a browser would otherwise be: serves the files, keeps the data, passes messages, owns the windows and the tray icon |
| `shim.js` | The APIs the shared pages expect, on top of that |
| `preload.js` | The narrow door between a page and `main.js` |
| `engine.html`, `engine.js` | A hidden window that is always open, with the timer and its sounds in it |
| `overlay.html`, `overlay.js` | A see-through layer over every other program, with the widget from `floating_widget.js` on it |
| `launcher.html`, `launcher.js` | The small icon over every other program, its ring showing how far the timer has got |
| `words.js` | The program's own words, in all seven languages |
| `panel.js`, `panel.css` | What the program adds to the shared pages, which do not know about it |
| `quick_timer.js` | The small card for the timer's rhythm: a preset with one click, each length with − and + |

## What is on the screen

- **The icon** stays over every other program. A click opens or closes the widgets, a drag moves it, the right button opens the menu.
- **The widgets** are the timer, the tasks and the cat. Settings choose which of them to show. A click on the time goes on to the fullscreen timer. With the pointer on the timer, small buttons appear on its top edge: fireflies on the widget (off to begin with, as they cost processor time), the timer's rhythm, and hide.
- **The main window** holds everything else: tasks, statistics, settings. Its X only minimizes it, so the timer carries on and the taskbar button stays, with the timer's progress on it.
- **The fullscreen timer** fills the screen, clean of everything else. The icon and the widgets step aside for it.

The timer's rhythm opens from the widget's button, or in the main window and the fullscreen timer from a button among the small ones there or a click on the time. It saves as it goes. A stage already running finishes as it is, and changes apply from the next one.

The icon and the widgets can each be put away, from the settings or the menu, and then the program runs on the taskbar and in the tray only. They are shut rather than hidden, and with both gone it uses no processor or graphics card at all.

**Close the program and stop the timer**, in the settings or the menu, ends the program. The timer is paused where it was, with no sound.

## Running it

```
cd desktop
npm install
node node_modules/electron/install.js
npm start
```

In PowerShell, use `npm.cmd` if scripts are disabled on the system. The data is in `firefly-focus.json` in the program's folder under `%APPDATA%`.

## Building the package

```
npm.cmd --prefix desktop run dist
```

This gathers exactly the files the program needs (`FILES` in `tools/build.js`; a new file has to be added there) and packs them into `desktop/dist/FireflyFocus-<version>-x64.appx` for the Microsoft Store, which signs it itself. It also leaves the unpacked program in `desktop/dist/win-unpacked`, handy for trying it out; add `--user-data-dir=<a temporary folder>` to keep away from your real data.

For a real submission, first fill `store-identity.json` with the values Partner Center gives when the name is reserved. Everything else for the submission is in [STORE-LISTING.md](STORE-LISTING.md).

| Command | What it does |
|---|---|
| `npm.cmd --prefix desktop run tiles` | Draws the package's icons from the logo, into `build/appx` |
| `npm.cmd --prefix desktop run screenshots` | Takes the Store screenshots in every language from the real program, on throwaway data, into `dist/store-screenshots`. Its windows show on the screen meanwhile |

## Local only

The program must not reach the internet. `main.js` refuses every request that is not for its own files and turns off Chromium's search for a proxy on the local network, its pages have a security policy of their own, and the spellchecker, which would download dictionaries, is off.

To check it, run the program with `--log-net-log=<file>` and look through the log for hosts: there should be none.
