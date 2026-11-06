# Firefly Focus for Windows

An early prototype of the Windows program, built on Electron. It runs the same `buddy.js` as the extension and the app, with no copy of it here.

For now it does one thing: the cat wanders across the screen on a see-through layer over every other program, and clicks anywhere but on the cat reach whatever is underneath. The timer and the windows come next.

## Running it

```
cd desktop
npm install
npm start
```

Close it from the tray icon by the clock.

## Local only

The program must not reach the internet. `main.js` refuses every request that is not for its own files and turns off Chromium's search for a proxy on the local network, `overlay.html` forbids connections in its security policy, and the spellchecker, which would download dictionaries, is off.

To check it, run the program with `--log-net-log=<file>` and look through the log for hosts: there should be none.
