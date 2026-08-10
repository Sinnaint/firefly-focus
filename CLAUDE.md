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
| `shared.js` | Спільні дані сторінок розширення: `i18n` + `FIREFLY_PALETTE`. Підключається `<script>`'ом **перед** `sidepanel.js` і `fullscreen.js` |
| `sidepanel.html/css/js` | Повний UI панелі: таймер, задачі, статистика, налаштування |
| `fullscreen.html/css/js` | Повноекранний ambient-таймер в окремій вкладці. Токени тем і стилі світлячків тягне з `sidepanel.css`, свій CSS — тільки розкладка |
| `floating_widget.js` | Content script: Shadow DOM-віджет на `http/https` сторінках, весь CSS інлайном усередині (свій i18n) |
| `offscreen.html/js` | Синтез 4 звукових тем (bright/arcade/bell/soft) |

## Правила, які легко порушити

1. **Два окремі i18n-словники** — `messages` у `service_worker.js` (нотифікації) і `i18n` у `shared.js` (панель + повний екран). `floating_widget.js` має **третій**, урізаний, бо це content script і `shared.js` він не бачить. Мови: `uk, en, de, es, it, sk, cs` (fallback — `uk`). Новий рядок = оновити всі, де він потрібен; нова мова = **всі три** + `<select id="languageSelect">` у `sidepanel.html` + масив `languages` у `normalizeSettings()`. Назви тем (Midnight/Daylight/Sage) і стилів звуку лишаються англійською в усіх мовах.
   `shared.js` — звичайний скрипт, а не модуль: він оголошує глобальні `i18n` і `FIREFLY_PALETTE`, тому в HTML має йти **перед** `sidepanel.js`/`fullscreen.js`.
2. **Нове налаштування** торкається: `DEFAULT_SETTINGS` + `normalizeSettings()` (service_worker.js), input у `sidepanel.html`, `collectSettingsFrom()` + `applySettingsTo()` (shared.js), підписи в i18n ×7 мов. `normalizeSettings()` — єдине місце валідації/клемпів; UI шле сирі значення.
   Форма налаштувань існує **в одному екземплярі** — у `sidepanel.html`. Повноекранна шторка клонує її звідти через `fetch` + `DOMParser` (`buildSettingsSheet()` у fullscreen.js), тому новий інпут з'являється там сам собою. Читання/запис форми — теж спільні (`collectSettingsFrom`/`applySettingsTo` беруть `root`, і те, чого в цьому root немає, підставляють зі стану). Не дублювати цю розмітку в fullscreen.html.
3. **Не перемальовувати список задач на кожен тік.** `renderTasks()` захищений відбитком `tasksSignature()` (`lastTasksSignature`) — без нього нативний date picker дедлайну закривається кожні 500 мс (це вже був баг, виправлений у 2.5.0).
4. **Теми**: `midnight` (dark, default), `daylight` (light), `sage` (green). Палітри: midnight — **«Moon»** (глибокий фіолет + маджента), daylight — **«Twine»** (бузок-рум'янець + троянда/барвінок/орхідея), sage — зелена поверхня + бурштин. Кольори живуть у **чотирьох** місцях: `body[data-theme]` у `sidepanel.css`; `.widget[data-theme]` в інлайн-CSS `floating_widget.js`; `FIREFLY_PALETTE` (окремо в sidepanel.js і floating_widget.js); колір бейджа в `updateBadge()` (service_worker.js) — там навмисно глибші відтінки, щоб читалось на світлому й темному тулбарі. Нова тема = усі ці місця + `colorThemes` у `normalizeSettings()` + `<select id="themeSelect">`.
   **Готові палітри майже ніколи не лягають напряму**: пастельні свотчі провалюють контраст як текст (≤2:1), майже-чорні — як акценти. Беріть їх на фони/чипи, а для тексту й акцентів виводьте тони тієї ж барви, доведені до 4.5:1. Перевіряти обов'язково: `.mode` (акцент на картці), `.hint`/`--muted`, `--subtle` у статистиці, пара `--on-accent`/`--accent` на `.primary`, пара `--accent-text`/`--accent-soft` на чипі й вторинних кнопках.
5. **Ліміти даних**: ≤30 задач, текст ≤90 символів, дедлайн — рядок `YYYY-MM-DD` або `null` (`normalizeDeadline`). Дедлайни: протерміновано = червоне (`overdue`), ≤2 днів = бурштинове (`soon`) — логіка `deadlineUrgency()` продубльована в sidepanel.js і floating_widget.js.
6. **Три різні способи «прибрати» віджет — не плутати.** `×` ховає його лише до перезавантаження сторінки (`sessionDismissed`, у сховище не йде). Стрілка поруч згортає до таймера з кнопками (`floatingWidgetCompact` — зберігається, `.widget[data-compact]`). Постійне вимкнення — тумблер `floatingWidgetEnabled`.
   `floatingWidgetCompact` — виняток із правила 2: інпута в панелі немає, він перемикається з самого віджета. Але його **обов'язково** треба протягувати через `collectSettings()` у sidepanel.js, інакше будь-яке збереження налаштувань із панелі скине віджет назад у розгорнутий стан. Те саме стосується `widgetMode`.
7. **Приватність — публічна обіцянка** (README, PRIVACY.md, лістинг): жодних зовнішніх запитів, жодного читання контенту сторінок. Не додавати fetch/аналітику/CDN.

## Реліз

Bump версії у **`manifest.json` + бейдж у `README.md` + запис у `CHANGELOG.md`** (SemVer). Перед публікацією в стор: зробити реальні скриншоти в `docs/screenshots/` (список у тамтешньому README) і замінити плейсхолдер URL приватності `https://github.com/<user>/<repo>/...` у `STORE-LISTING.md`.
