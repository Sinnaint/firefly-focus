# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Firefly Focus — Pomodoro Timer & Tasks** — Chrome-розширення (Manifest V3, `minimum_chrome_version: 116`), версія **2.5.0**. Спокійний Pomodoro-таймер: side panel, плаваючий віджет на сторінках, задачі з дедлайнами, анімація світлячків, 3 теми, 7 мов, звуки через Web Audio. Повністю локальне — без акаунтів, аналітики й мережевих запитів.

- Чистий HTML/CSS/JS, **без збірки і без залежностей** — файли підключаються як є.
- Git-репозиторію немає. Публікація в Chrome Web Store ще не відбулася (лістинг готовий у `STORE-LISTING.md`).

## Запуск / тестування

Немає ні тестів, ні лінтера. Перевірка ручна: `chrome://extensions` → Developer mode → **Load unpacked** → обрати цю папку → після правок натискати **Reload** на картці розширення (для content script ще й перезавантажити вкладку).

## Архітектура

Джерело істини — `service_worker.js`. Весь стан живе одним об'єктом у `chrome.storage.local` під ключем **`pomodoro`**: `{ mode, running, endsAt, remainingMs, sessionsDone, settings, tasks, stats }`.

- UI (side panel, віджет) **не рахує таймер сам** — він виводить `endsAt - Date.now()` і раз на 500 мс перемальовується (`setInterval(render, 500)`).
- Обидва UI шлють повідомлення `chrome.runtime.sendMessage({ type, ... })` у service worker (типи: `GET_STATE`, `START`, `PAUSE`, `SKIP_STAGE`, `RESET_TIMER`, `RESET_STATS`, `SAVE_SETTINGS`, `ADD_TASK`, `SET_TASK_DEADLINE`, `TOGGLE_TASK`, `DELETE_TASK`, `CLEAR_DONE_TASKS`, `OPEN_SIDE_PANEL`, `CLOSE_OFFSCREEN`) і отримують `{ ok, state }`.
- Синхронізація між контекстами — через `chrome.storage.onChanged`: обидва UI слухають зміни ключа `pomodoro` і перемальовуються.
- Завершення етапів — через `chrome.alarms` (`pomodoro-end-alarm`, `pomodoro-warning-alarm`), тому таймер працює і з закритою панеллю. `restoreAlarmIfNeeded()` при старті браузера доганяє пропущене завершення.
- Звук: SW → `ensureOffscreenDocument()` → повідомлення `{ target: "offscreen", type: "PLAY_SIGNAL", kind, theme }` → `offscreen.js` синтезує фразу через Web Audio. Offscreen-документ **сам закривається** (~1 с після останнього звуку, шле `CLOSE_OFFSCREEN`), інакше Chrome показує постійний індикатор фонового документа — не ламати цю логіку.

### Файли

| Файл | Роль |
|---|---|
| `service_worker.js` | Стан, таймер, alarms, задачі, статистика, нормалізація, бейдж, нотифікації (i18n `messages`) |
| `sidepanel.html/css/js` | Повний UI панелі: таймер, задачі, статистика, налаштування (i18n `i18n`) |
| `floating_widget.js` | Content script: Shadow DOM-віджет на `http/https` сторінках, весь CSS інлайном усередині (свій i18n) |
| `offscreen.html/js` | Синтез 4 звукових тем (bright/arcade/bell/soft) |

## Правила, які легко порушити

1. **Три окремі i18n-словники** — у `service_worker.js` (`messages`), `sidepanel.js` (`i18n`), `floating_widget.js` (`i18n`). Мови: `uk, en, de, es, it, sk, cs` (fallback — `uk`). Новий рядок/мова = оновити **всі три** + `<select id="languageSelect">` у `sidepanel.html` + масив `languages` у `normalizeSettings()`. Назви тем (Midnight/Daylight/Sage) і стилів звуку лишаються англійською в усіх мовах.
2. **Нове налаштування** торкається: `DEFAULT_SETTINGS` + `normalizeSettings()` (service_worker.js), input у `sidepanel.html`, `els` + `collectSettings()` + `syncSettingsInputs()` (sidepanel.js), підписи в i18n ×7 мов. `normalizeSettings()` — єдине місце валідації/клемпів; UI шле сирі значення.
3. **Не перемальовувати список задач на кожен тік.** `renderTasks()` захищений відбитком `tasksSignature()` (`lastTasksSignature`) — без нього нативний date picker дедлайну закривається кожні 500 мс (це вже був баг, виправлений у 2.5.0).
4. **Теми**: `midnight` (dark, default), `daylight` (light), `sage` (green). Палітра — **«Ink & Ember»**: midnight = індигова ніч + жарке золото, daylight = тепла папір + чорнило й бронза, sage = зелена поверхня + бурштин. Режим «робота» теплий у **всіх** темах (це світлячок), перерви — холодні. Кольори живуть у **чотирьох** місцях: `body[data-theme]` у `sidepanel.css`; `.widget[data-theme]` в інлайн-CSS `floating_widget.js`; `FIREFLY_PALETTE` (окремо в sidepanel.js і floating_widget.js); колір бейджа в `updateBadge()` (service_worker.js) — там навмисно глибші відтінки, щоб читалось на світлому й темному тулбарі. Нова тема = усі ці місця + `colorThemes` у `normalizeSettings()` + `<select id="themeSelect">`.
5. **Ліміти даних**: ≤30 задач, текст ≤90 символів, дедлайн — рядок `YYYY-MM-DD` або `null` (`normalizeDeadline`). Дедлайни: протерміновано = червоне (`overdue`), ≤2 днів = бурштинове (`soon`) — логіка `deadlineUrgency()` продубльована в sidepanel.js і floating_widget.js.
6. **Кнопка × на віджеті** ховає його лише до перезавантаження сторінки (`sessionDismissed`, не зберігається). Постійне вимкнення — тільки тумблер `floatingWidgetEnabled`.
7. **Приватність — публічна обіцянка** (README, PRIVACY.md, лістинг): жодних зовнішніх запитів, жодного читання контенту сторінок. Не додавати fetch/аналітику/CDN.

## Реліз

Bump версії у **`manifest.json` + бейдж у `README.md` + запис у `CHANGELOG.md`** (SemVer). Перед публікацією в стор: зробити реальні скриншоти в `docs/screenshots/` (список у тамтешньому README) і замінити плейсхолдер URL приватності `https://github.com/<user>/<repo>/...` у `STORE-LISTING.md`.
