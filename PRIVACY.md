# Privacy Policy — Firefly Focus

_Last updated: 2026-11-06_

This policy covers Firefly Focus in all its forms: the Windows program, the Chrome extension and the web app. It explains exactly what they do and do not do with your information.

## Short version

**Firefly Focus does not collect, transmit, sell or share any personal data. Everything you enter stays on your own device.** There is no account, no sign-in, no analytics and no advertising, and we have no servers that could receive your data.

## What is stored, and where

Firefly Focus saves the following **on your device only**:

- Timer state (current mode, whether it is running, remaining time).
- Your tasks, including any optional deadlines and completion status. Task text is whatever you type, so keep in mind that it may contain anything you choose to write there.
- Your settings (durations, theme, language, sound style, toggles and so on).
- Daily statistics (sessions completed today, focus time, totals).
- Where you last left the widgets and the on-screen icon, and what the cat is doing.

Where exactly:

- **Windows program:** in one file in the program's own data folder on your computer. It is protected the way your other files are, by your Windows account, and it is not encrypted separately.
- **Chrome extension:** in the browser's `chrome.storage.local`.
- **Web app:** in your browser's storage for the site.

This data is used only to run the timer and show your tasks and statistics. It is not sent to us or to anyone else.

## What Firefly Focus does NOT do

- ❌ No data is transmitted over the network, and no external requests are made.
- ❌ No analytics, telemetry, crash reports, tracking pixels or advertising IDs.
- ❌ No automatic updater inside the program. Updates of the Windows program come through the Microsoft Store.
- ❌ No reading, collecting or transmitting of what you do in other programs or on the web pages you visit.
- ❌ No selling or sharing of data with third parties.
- ❌ No cookies.

## The Windows program

The program runs as a desktop app, which Windows and the Microsoft Store list as being able to use "all system resources". This is how desktop programs work in general, and Firefly Focus needs it to draw its widgets and icon over your other programs. It does not use it to look at them: it does not read your screen, files, keystrokes or the contents of other windows. It sees the mouse pointer's position over the screen only to know when the pointer is on one of its own widgets, and it sees what you type only while you are typing into one of its own fields.

The program also refuses network connections in its own code, so it stays local even if something in it were to try.

## The Chrome extension

The extension requests access to `http://*/*` and `https://*/*` for a single purpose: to show the optional draggable **floating timer widget** on web pages so your timer stays visible while you work. The content script only renders the widget (inside an isolated Shadow DOM) and reads and writes the extension's own local storage. **It does not read, modify, store or transmit the content of the pages you visit.**

Its other permissions, `alarms`, `storage`, `notifications`, `offscreen` and `sidePanel`, are used solely to run the timer, save your data locally, show notifications and play sounds.

## Your control over your data

All of it is on your device, so you can see, change and remove it at any time:

- Change or delete tasks and settings within Firefly Focus, and clear statistics with **Reset statistics** in the settings.
- **Windows program:** uninstalling it removes its data as well.
- **Chrome extension:** removing it from `chrome://extensions` deletes its local storage.

## Children

Firefly Focus collects no information from anyone, children included.

## Changes to this policy

If this policy changes, the updated version will be published in this repository with a new "Last updated" date.

## Contact

Questions about privacy? Contact: **gusarivan21@gmail.com**
