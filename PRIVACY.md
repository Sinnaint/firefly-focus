# Privacy Policy — Firefly Focus

_Last updated: 2026-07-09_

Firefly Focus ("the extension") is built to be private by default. This policy explains exactly what the extension does and does not do with your information.

## Short version

**Firefly Focus does not collect, transmit, sell or share any personal data. Everything you enter stays on your own device.**

## What data the extension stores

The extension saves the following **locally on your device** using the browser's `chrome.storage.local` API:

- Timer state (current mode, whether it's running, remaining time).
- Your tasks, including any optional deadlines and completion status.
- Your settings (durations, theme, language, sound style, toggles, etc.).
- Daily statistics (sessions completed today, focus time, totals) and the floating widget's saved position.

This data never leaves your browser. It is not sent to us or to any third party, and there is no account or login of any kind.

## What the extension does NOT do

- ❌ No data is transmitted over the network. The extension makes **no external requests**.
- ❌ No analytics, telemetry, tracking pixels or advertising IDs.
- ❌ No reading, collecting or transmitting of the content of the web pages you visit.
- ❌ No selling or sharing of data with third parties.
- ❌ No cookies.

## Host (website) access

The extension requests access to `http://*/*` and `https://*/*` for a single purpose: to inject the optional draggable **floating timer widget** onto web pages so your timer stays visible while you work. The content script only renders the widget (inside an isolated Shadow DOM) and reads/writes the extension's own local storage. **It does not read, modify, store or transmit the content of the pages you visit.**

## Permissions summary

- `alarms`, `storage`, `notifications`, `offscreen`, `sidePanel` — used solely to run the timer, save your data locally, show notifications and play sounds.
- Host access — used solely to display the floating widget.

## Data deletion

Because all data is stored locally, you can remove it at any time by:
- clearing tasks/stats from within the extension, or
- removing the extension from `chrome://extensions` (this deletes its local storage).

## Changes to this policy

If this policy changes, the updated version will be published in this repository with a new "Last updated" date.

## Contact

Questions about privacy? Contact: **gusarivan21@gmail.com**
