# Chrome Web Store — Listing Copy

Everything below is ready to paste into the Chrome Web Store Developer Dashboard.
Sections map 1:1 to the dashboard fields.

---

## Item name
```
Firefly Focus — Pomodoro Timer & Tasks
```
_(39 characters — well under the 75-character limit.)_

## Summary (short description, ≤ 132 chars)
```
A calm, private Pomodoro timer with a floating widget, task deadlines, firefly animations and 3 themes. No accounts, no tracking.
```

## Category
**Primary:** Workflow & Planning (Productivity)

## Language
English (in-app localization: English, Ukrainian, German, Spanish, Italian, Slovak, Czech)

---

## Detailed description (paste into the store)

```
Firefly Focus is a calm, distraction-free Pomodoro timer that keeps you on task without getting in your way — and without ever touching your data.

A gentle swarm of fireflies drifts over the timer while you focus, three hand-tuned themes keep it easy on the eyes, and a small floating widget follows you from tab to tab so you always know how much time is left.

WHY YOU'LL LIKE IT

• Stays out of your way — a soft, glassy interface with no clutter and no noise.
• Actually private — everything is stored on your device. No account, no sign-in, no analytics, no network requests.
• Looks great everywhere — Midnight (dark), Daylight (light) and Sage (calm green) themes, each with its own accent colours.

FEATURES

• Classic Pomodoro cycles — focus, short break and long break, with adjustable lengths and optional auto-continue.
• Floating widget on any page — drag it anywhere, click it to open the full panel, or close it in one tap. Your top tasks and the countdown stay visible while you work.
• Full side panel — the complete timer, tasks, daily stats and settings in Chrome's native side panel.
• Tasks with deadlines — give any task an optional due date. Overdue tasks turn red, tasks due soon turn amber. Your tasks are saved across days and restarts, so you can pick up unfinished work tomorrow.
• Firefly animation — continuous, softly glowing fireflies that match the current theme and mode.
• Warm, expressive sounds — four non-harsh sound styles for stage changes and reminders (or turn them off).
• Desktop notifications — start/stop alerts plus a configurable "almost done" reminder.
• Daily stats & goal — sessions completed, focus time, and progress toward your daily target.
• 7 languages — English, Ukrainian, German, Spanish, Italian, Slovak and Czech; switch any time.

PRIVACY FIRST

Firefly Focus does not collect, transmit or sell any data. Your timer, tasks, settings and stats live only in your browser's local storage. The extension makes no external network requests and never reads the content of the pages you visit — the website permission is used solely to draw the optional floating widget.

Set a timer, add a task, and let the fireflies keep you company. Happy focusing! ✦
```

---

## Single purpose (required)
```
Firefly Focus is a Pomodoro productivity timer. Its single purpose is to help the user run timed focus/break sessions and track simple tasks, shown in a side panel and an optional in-page floating widget.
```

---

## Permission justifications (required, per permission)

**alarms**
```
Used to fire the timer's end signal and the optional pre-end reminder reliably, even when the side panel is closed.
```

**storage**
```
Used to save the user's timer state, tasks, settings and daily statistics locally on their device.
```

**notifications**
```
Used to show desktop notifications when a focus or break stage starts or ends, and for the "almost done" reminder.
```

**offscreen**
```
Used to play short completion and reminder sounds via the Web Audio API, because the service worker cannot play audio directly.
```

**sidePanel**
```
Used to display the full timer, task list and settings UI in Chrome's side panel.
```

**Host permission (http://*/*, https://*/*)**
```
Used only to inject the optional draggable floating timer widget onto web pages so the countdown stays visible while the user works. The content script renders the widget inside an isolated Shadow DOM and reads/writes only the extension's own local storage. It does not read, modify, store or transmit the content of the pages the user visits.
```

---

## Data usage disclosures (Privacy practices tab)

- **Does this item collect or use personal or sensitive user data?** No.
- Personally identifiable information: **Not collected**
- Health / financial / authentication / personal communications / location / web history / user activity / website content: **Not collected**
- **Sold to third parties:** No
- **Used or transferred for purposes unrelated to the item's core functionality:** No
- **Used or transferred to determine creditworthiness / for lending:** No
- **Privacy policy URL:** `https://github.com/Sinnaint/firefly-focus/blob/main/PRIVACY.md`

---

## Promotional copy (optional store assets)

**Small promo tile / marquee headline**
```
Focus, gently. A private Pomodoro timer with fireflies.
```

**One-liner (for social / GitHub description)**
```
A calm, private Pomodoro timer for Chrome — floating widget, task deadlines, firefly animations and 3 themes.
```

---

## Promotional images (ready to upload)

Located in `assets/promo/` (PNG = upload these; SVG = editable source):

| File | Size | Store field |
|---|---|---|
| `assets/promo/promo-small.png` | 440×280 | Small promo tile |
| `assets/promo/promo-marquee.png` | 1400×560 | Marquee promo tile |

## Suggested screenshots (1280×800 or 640×400)

1. Side panel — Midnight theme, timer running, tasks with deadlines.
2. Floating widget over a real website (fireflies visible).
3. Daylight (light) theme — timer + tasks.
4. Sage theme — timer + tasks.
5. Settings — themes, sounds, durations and toggles.

_Tip: the store shows the first screenshot most prominently — lead with the one that best conveys "calm focus + fireflies."_

## Search-relevant terms (use naturally, do not keyword-stuff)
pomodoro, focus timer, productivity, tasks, to-do, deadlines, dark mode, side panel, floating timer, study timer
