# Changelog

All notable changes to Firefly Focus are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [2.5.0] — 2026-08-10

First Chrome Web Store release.

### Added
- **New brand identity** — "Firefly Focus" name and a firefly-in-a-timer-ring icon in the Moon palette, shipped as 16/32/48/128 px PNGs. The logo, wordmark and both store promo tiles share it.
- **Three themes** — Midnight (dark), Daylight (light) and Sage (calm green), each with its own tasteful accent palette. Theme switcher lives in the panel header, next to the language selector.
- **Task deadlines** — optional due date per task, with overdue (red) and due-soon (amber) highlighting in both the side panel and the floating widget.
- **Four more languages** — German, Spanish, Italian, Slovak and Czech (seven in total, alongside English and Ukrainian). Theme names stay untranslated.
- **Adjustable text size** — a "Text size" setting (80–140%) scales the interface text in both the side panel and the floating widget, with live preview. The large timer digits stay fixed so they never overflow the ring.
- **Close button (×)** on the floating widget — a non-destructive dismiss that hides it on the current page only; it returns on reload, and the settings toggle remains the permanent on/off.

### Changed
- **New palettes for Midnight and Daylight.** Midnight follows "Moon" (`#F5D5E0 · #6667AB · #7B337E · #420D4B · #210635`) — a deep violet night with a magenta focus accent and moonlit pink on the long break. Daylight follows "Twine" (`#F4E7FB · #F3DCDC · #F5BCBA · #E3AADD · #C8A8E9 · #C3C7F3`) — a lilac-to-blush page with rose, periwinkle and orchid accents. Both source palettes are pastel or near-black, so the mode accents are contrast-corrected tints and shades of those hues; every text and control pair clears WCAG AA. The firefly colours and the toolbar badge follow suit. **Sage is unchanged.**
- **Firefly animation reworked** — fireflies are now continuous and stay around the widget/panel instead of scattering across the screen; their colour follows the active theme and mode.
- **Sound signals redesigned** — warmer, more expressive melodic phrases with soft envelopes and a low-pass filter so they are pleasant, not harsh.
- **Refined visual design** — softer glass surfaces, smoother buttons, glowing progress ring, styled dropdowns and improved typography.
- Theme names (**Midnight / Daylight / Sage**) and sound-style names (**Bright clean / Arcade / Bell / Soft**) now stay in English across every language, including Ukrainian.

### Removed
- The floating-widget **opacity** setting (replaced by a fixed, pleasant default that brightens on hover).

### Fixed
- **Deadline date picker** no longer flickers or snaps shut — the task list is now only rebuilt when a task actually changes, not on every one-second timer tick.
- **Offscreen audio document** now closes itself shortly after each sound, so Chrome no longer shows the persistent background-document ("recording"-style) indicator on the extension while idle. No media is ever captured — the document only plays the timer sounds.

## [2.4.0]
- Multilingual side panel, draggable floating widget and firefly animations (baseline release).
