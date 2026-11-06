# Firefly Focus for Windows

The Windows program, in progress, built on Electron. Like the app, it is not a rewrite: it runs the extension's own `service_worker.js`, `offscreen.js`, `sidepanel.html`, `fullscreen.html`, `floating_widget.js` and `buddy.js`, with no copies of them here.

| File | What it does |
|---|---|
| `main.js` | The part a browser would otherwise be: serves the files, keeps the data, passes messages, owns the windows and the tray icon |
| `shim.js` | `chrome.*` on top of that, for the pages. The counterpart of `app/shim.js` |
| `preload.js` | The narrow door between a page and `main.js` |
| `engine.html`, `engine.js` | A hidden window that is always open, with the timer and its sounds in it |
| `overlay.html`, `overlay.js` | A see-through layer over every other program, with the widget from `floating_widget.js` on it |
| `launcher.html`, `launcher.js` | The small icon over every other program, its ring showing how far the timer has got |
| `words.js` | The program's own words, in all seven languages |
| `panel.js`, `panel.css` | What the program adds to the extension's pages, which do not know about it |

## What is on the screen

- **The icon** stays over every other program. A click opens or closes the widgets, a drag moves it, the right button opens the menu.
- **The widgets** are the timer, the tasks and the cat. Settings choose which of them to show. A click on the time goes on to the fullscreen timer.
- **The main window** holds everything else: tasks, statistics, settings. Its X only minimizes it, so the timer carries on and the taskbar button stays, with the timer's progress on it.
- **The fullscreen timer** is the extension's own. The icon and the widgets step aside for it.

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

## Local only

The program must not reach the internet. `main.js` refuses every request that is not for its own files and turns off Chromium's search for a proxy on the local network, its pages have a security policy of their own, and the spellchecker, which would download dictionaries, is off.

To check it, run the program with `--log-net-log=<file>` and look through the log for hosts: there should be none.
