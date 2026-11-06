/*
 * The timer's rhythm in one small card: a preset with one click, or each length
 * with − and +. It saves as it goes, with no Save button and no long form to
 * scroll through. The full form in the settings stays for everything else.
 *
 * The same card opens from the main window, the fullscreen timer and the widget.
 * It asks the engine for what it needs by itself, and takes its colours from
 * wherever it lands: the widget's tokens if it is on the layer, the page's if not.
 * Needs shared.js for the presets and their names, and words.js.
 */
const FireflyQuickTimer = (() => {
  // Sliders, so it does not read as the settings' gear next to it.
  const ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.6"/><circle cx="8" cy="17" r="2.6"/></svg>';

  // The limits are the form's, in sidepanel.html; normalizeSettings() has the last word.
  const FIELDS = [
    { key: "workMinutes", word: "workMinutesLabel", min: 1, max: 180, step: 5 },
    { key: "shortBreakMinutes", word: "shortBreakLabel", min: 1, max: 60, step: 1 },
    { key: "longBreakMinutes", word: "longBreakLabel", min: 1, max: 120, step: 5 },
    { key: "cyclesBeforeLong", word: "cyclesBeforeLongLabel", min: 1, max: 12, step: 1 },
  ];
  const PRESET_WORDS = {
    classic: "presetClassic",
    deep: "presetDeep",
    desktime: "presetDesktime",
    ultradian: "presetUltradian",
    sprint: "presetSprint",
    custom: "presetCustom",
  };
  const SAVE_AFTER_MS = 250;
  const REPEAT_AFTER_MS = 420;
  const REPEAT_EVERY_MS = 110;

  // Two classes on each rule: the pages style bare buttons and inputs, and this
  // sheet comes before theirs.
  const CSS = `
    .quick {
      display: grid;
      gap: 11px;
      padding: 13px;
      border-radius: 20px;
      color: var(--w-text, var(--text));
      font-size: calc(12.5px * var(--text-scale, 1));
      font-weight: 700;
      cursor: default;
    }
    .quick[hidden] {
      display: none;
    }
    .quick .quick-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 2px 8px;
    }
    .quick .quick-title {
      color: var(--w-muted, var(--muted));
    }
    .quick .quick-name {
      font-weight: 900;
    }
    .quick .quick-presets {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
    }
    .quick .quick-preset {
      min-height: 0;
      margin: 0;
      padding: 7px 0;
      border: 1px solid var(--w-hairline, var(--stroke));
      border-radius: 10px;
      color: inherit;
      background: var(--w-soft, var(--surface-soft));
      box-shadow: none;
      font: inherit;
      font-size: calc(11.5px * var(--text-scale, 1));
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }
    .quick .quick-preset:hover {
      border-color: var(--w-border-strong, var(--stroke-strong));
    }
    .quick .quick-preset[aria-pressed="true"] {
      border-color: transparent;
      color: var(--on-accent);
      background: var(--accent);
    }
    .quick .quick-fields {
      display: grid;
      gap: 6px;
    }
    .quick .quick-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
    }
    .quick .quick-label {
      color: var(--w-muted, var(--muted));
      line-height: 1.2;
    }
    .quick .quick-stepper {
      display: grid;
      grid-template-columns: 26px 38px 26px;
      align-items: center;
    }
    .quick .quick-step {
      display: grid;
      place-items: center;
      width: 26px;
      min-height: 0;
      height: 26px;
      margin: 0;
      padding: 0;
      border: 1px solid var(--w-hairline, var(--stroke));
      border-radius: 50%;
      color: inherit;
      background: var(--w-soft, var(--surface-soft));
      box-shadow: none;
      font: inherit;
      font-size: 15px;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
      touch-action: none;
    }
    .quick .quick-step:hover:not(:disabled) {
      border-color: var(--w-border-strong, var(--stroke-strong));
    }
    .quick .quick-step:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .quick .quick-value {
      width: 100%;
      min-height: 0;
      height: 26px;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 6px;
      outline-offset: 0;
      color: inherit;
      background: none;
      box-shadow: none;
      font: inherit;
      font-size: calc(14px * var(--text-scale, 1));
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      text-align: center;
      appearance: textfield;
    }
    .quick .quick-value::-webkit-outer-spin-button,
    .quick .quick-value::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }
    .quick .quick-hint {
      margin: 0;
      color: var(--w-muted, var(--muted));
      font-size: calc(11px * var(--text-scale, 1));
      font-weight: 600;
      line-height: 1.35;
    }
    .quick .quick-hint[hidden] {
      display: none;
    }
  `;

  function addStyles(root) {
    const target = root === document ? document.head : root;
    if (target.querySelector("style[data-quick-timer]")) return;
    const style = document.createElement("style");
    style.dataset.quickTimer = "";
    style.textContent = CSS;
    target.prepend(style);
  }

  // By the step and onto its multiples: 52 goes to 55 or 50, not 57 or 47.
  function nudge(value, { step, min, max }, direction) {
    const next = direction > 0 ? Math.floor(value / step) * step + step : Math.ceil(value / step) * step - step;
    return Math.min(max, Math.max(min, next));
  }

  function create(parent, { before = null, className = "", onToggle = () => {} } = {}) {
    addStyles(parent.getRootNode());

    const card = document.createElement("section");
    card.className = `quick ${className}`.trim();
    card.hidden = true;
    card.innerHTML = `
      <div class="quick-head"><span class="quick-title"></span><span class="quick-name"></span></div>
      <div class="quick-presets"></div>
      <div class="quick-fields"></div>
      <p class="quick-hint" hidden></p>
    `;
    parent.insertBefore(card, before);
    // On the layer, this keeps a click in the card from starting to drag the widget.
    card.addEventListener("pointerdown", (event) => event.stopPropagation());

    const title = card.querySelector(".quick-title");
    const name = card.querySelector(".quick-name");
    const hint = card.querySelector(".quick-hint");

    let state = null;
    let previewing = null;
    // What has been asked for and is not in the state yet: shown already, and sent
    // along with every save, so that one save can never undo the one before it.
    let pending = {};
    let sending = {};
    let inFlight = 0;
    let saveTimer = null;

    const values = () => ({ ...state?.settings, ...sending, ...pending });

    function say() {
      const language = i18n[state?.settings?.language] ? state.settings.language : "uk";
      return { ...i18n[language], ...DESKTOP_WORDS[language].pages };
    }

    async function save() {
      clearTimeout(saveTimer);
      saveTimer = null;
      if (!state || !Object.keys(pending).length) return;
      sending = { ...sending, ...pending };
      pending = {};
      inFlight += 1;
      const response = await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        settings: { ...state.settings, ...sending },
      });
      inFlight -= 1;
      if (response?.state) state = response.state;
      if (inFlight === 0) sending = {};
      render();
    }

    function saveSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, SAVE_AFTER_MS);
    }

    /* ---------- The presets ---------- */

    const presetButtons = Object.entries(TIMER_PRESETS).map(([key, preset]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-preset";
      button.textContent = `${preset.workMinutes}/${preset.shortBreakMinutes}`;
      button.dataset.preset = key;
      button.addEventListener("click", () => {
        Object.assign(pending, preset);
        render();
        save();
      });
      button.addEventListener("pointerenter", () => {
        previewing = key;
        render();
      });
      button.addEventListener("pointerleave", () => {
        previewing = null;
        render();
      });
      card.querySelector(".quick-presets").append(button);
      return button;
    });

    /* ---------- The lengths ---------- */

    const rows = FIELDS.map((field) => {
      const row = document.createElement("div");
      row.className = "quick-row";
      row.innerHTML = `
        <span class="quick-label"></span>
        <div class="quick-stepper">
          <button class="quick-step" type="button" data-direction="-1">−</button>
          <input class="quick-value" type="number" min="${field.min}" max="${field.max}" />
          <button class="quick-step" type="button" data-direction="1">+</button>
        </div>
      `;
      card.querySelector(".quick-fields").append(row);

      const input = row.querySelector(".quick-value");
      const steppers = [...row.querySelectorAll(".quick-step")];

      const step = (direction) => {
        pending[field.key] = nudge(Number(values()[field.key]), field, direction);
        render();
        saveSoon();
      };

      // Held down, it keeps going; only once it is let go does it save.
      let holding = null;
      const letGo = () => {
        clearTimeout(holding);
        clearInterval(holding);
        holding = null;
      };

      for (const button of steppers) {
        const direction = Number(button.dataset.direction);
        button.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          step(direction);
          letGo();
          holding = setTimeout(() => {
            holding = setInterval(() => step(direction), REPEAT_EVERY_MS);
          }, REPEAT_AFTER_MS);
        });
        for (const type of ["pointerup", "pointerleave", "pointercancel"]) button.addEventListener(type, letGo);
        // From the keyboard there is no press to have acted on already.
        button.addEventListener("click", (event) => {
          if (event.detail === 0) step(direction);
        });
      }

      input.addEventListener("change", () => {
        const typed = Math.round(Number(input.value));
        if (Number.isFinite(typed) && input.value !== "") {
          pending[field.key] = Math.min(field.max, Math.max(field.min, typed));
          saveSoon();
        }
        render();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") input.blur();
      });
      // A click selects the number, so typing replaces it rather than adding to it.
      input.addEventListener("click", () => input.select());

      return { field, row, input, steppers };
    });

    /* ---------- Drawing ---------- */

    function render() {
      if (!state || card.hidden) return;
      const words = say();
      const current = values();
      const preset = derivePreset(current);
      const shown = previewing || preset;

      title.textContent = words.timerPresetLabel;
      name.textContent = words[PRESET_WORDS[shown]].split(" · ")[0];
      for (const button of presetButtons) {
        button.title = words[PRESET_WORDS[button.dataset.preset]];
        button.setAttribute("aria-pressed", String(button.dataset.preset === preset));
      }

      const root = card.getRootNode();
      for (const { field, row, input, steppers } of rows) {
        row.querySelector(".quick-label").textContent = words[field.word];
        input.setAttribute("aria-label", words[field.word]);
        // Not under the hands of someone typing into it.
        if (root.activeElement !== input) input.value = current[field.key];
        steppers[0].disabled = current[field.key] <= field.min;
        steppers[1].disabled = current[field.key] >= field.max;
      }

      hint.textContent = words.quickTimerRunning;
      hint.hidden = !state.running;
    }

    chrome.storage.onChanged.addListener((changes) => {
      if (!changes.pomodoro?.newValue) return;
      state = changes.pomodoro.newValue;
      render();
    });
    chrome.storage.local.get("pomodoro").then((data) => {
      state = state || data.pomodoro;
      render();
    });

    /* ---------- Opening and closing ---------- */

    const isOpen = () => !card.hidden;

    function open() {
      card.hidden = false;
      render();
      onToggle(true);
    }

    function close() {
      if (card.hidden) return;
      card.getRootNode().activeElement?.blur();
      card.hidden = true;
      previewing = null;
      save();
      onToggle(false);
    }

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
    });

    return { element: card, open, close, isOpen, toggle: () => (isOpen() ? close() : open()) };
  }

  return { create, ICON };
})();
