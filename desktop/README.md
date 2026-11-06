# Firefly Focus for Windows

The Windows program, in progress, built on Electron. Like the app, it is not a rewrite: it runs the extension's own `service_worker.js`, `offscreen.js`, `sidepanel.html`, `fullscreen.html` and `buddy.js`, with no copies of them here.

| File | What it does |
|---|---|
| `main.js` | The part a browser would otherwise be: serves the files, keeps the data, passes messages, owns the windows and the tray icon |
| `shim.js` | `chrome.*` on top of that, for the pages. The counterpart of `app/shim.js` |
| `preload.js` | The narrow door between a page and `main.js` |
| `engine.html`, `engine.js` | A hidden window that is always open, with the timer and its sounds in it |
| `overlay.html`, `overlay.js` | A see-through layer over every other program, where the cat wanders |

So far: the timer runs with every window shut, the main window holds the tasks, statistics and settings, the fullscreen timer is the extension's own, and the cat comes out on the layer when neither window is in front of you. Clicks anywhere but on the cat reach the program underneath. The small widgets and the on-screen icon come next.

Shutting the main window only hides it, and the timer carries on. **Quit** in the tray icon's menu stops the timer and ends the program.

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
