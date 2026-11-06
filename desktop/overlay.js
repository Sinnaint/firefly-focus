/*
 * The layer: a see-through window over every other program, with the widget from
 * floating_widget.js on it, the same one websites get.
 *
 * The window ignores the mouse, so clicks reach the program underneath, but
 * Windows still reports where the pointer is. Over a piece of the widget or the
 * cat, and for as long as a button is held down, it takes the mouse.
 *
 * It never takes the focus either, so that working in another program stays
 * undisturbed. The exception is typing into the widget, which needs the keyboard.
 */
(() => {
  const HOST_ID = "ai-pomodoro-floating-widget-host";
  const door = window.fireflyHost;
  const kind = new URLSearchParams(location.search).get("kind") || "full";
  const TYPING = 'input:not([type="checkbox"])';
  const FIREFLIES_KEY = "desktopWidgetFireflies";

  const SPARK_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.5l1.9 6.6 6.6 1.9-6.6 1.9-1.9 6.6-1.9-6.6L3.5 12l6.6-1.9z"/></svg>';

  /* ---------- What the program adds to the widget ---------- */

  // Off until asked for: moving by themselves, they redraw the whole layer at the
  // screen's full rate. With the timer alone on the layer, 10-20% of a core, not 1-2%.
  let firefliesOn = false;
  let timerState = null;
  let fireflyButton = null;
  let quickButton = null;

  function labelButtons() {
    if (!fireflyButton) return;
    const words = DESKTOP_WORDS[timerState?.settings?.language] || DESKTOP_WORDS.uk;
    fireflyButton.title = words.widget.fireflies;
    fireflyButton.setAttribute("aria-label", words.widget.fireflies);
    fireflyButton.setAttribute("aria-pressed", String(firefliesOn));
    // With fireflies off everywhere in the settings, this one has nothing to switch.
    fireflyButton.disabled = timerState?.settings?.fireflyAnimationEnabled === false;
    quickButton.title = words.pages.quickTimerTitle;
    quickButton.setAttribute("aria-label", words.pages.quickTimerTitle);
  }

  function edgeButton(className, icon) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `edge-btn ${className}`;
    button.innerHTML = icon;
    // A press here is a press of the button, not the start of dragging the widget.
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    return button;
  }

  function addControls({ piece, taskCard, render }) {
    fireflyButton = edgeButton("edge-fireflies", SPARK_ICON);
    fireflyButton.addEventListener("click", () => {
      firefliesOn = !firefliesOn;
      chrome.storage.local.set({ [FIREFLIES_KEY]: firefliesOn });
      labelButtons();
      render();
    });

    quickButton = edgeButton("edge-quick", FireflyQuickTimer.ICON);
    quickButton.setAttribute("aria-pressed", "false");
    const quick = FireflyQuickTimer.create(piece, {
      before: taskCard,
      className: "glass quick-on-widget",
      onToggle(open) {
        // It takes the task drawer's place while it is open, or the widget would
        // grow taller than a small screen.
        piece.dataset.quick = String(open);
        quickButton.setAttribute("aria-pressed", String(open));
        render();
      },
    });
    quickButton.addEventListener("click", () => quick.toggle());

    piece.append(fireflyButton, quickButton);
    labelButtons();
  }

  chrome.storage.local.get(["pomodoro", FIREFLIES_KEY]).then((data) => {
    timerState = data.pomodoro;
    firefliesOn = data[FIREFLIES_KEY] === true;
    labelButtons();
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pomodoro?.newValue) timerState = changes.pomodoro.newValue;
    labelButtons();
  });

  window.__FIREFLY_DESKTOP__ = {
    tasks: kind !== "timer",
    cat: kind === "full",
    words: DESKTOP_WORDS,
    // This runs all day beside other programs, and each frame costs the same
    // whatever the size of the window: measured, 30 a second takes half the
    // graphics card that 60 does, and a walk this slow looks no different. A cat
    // sitting still, with only its breath and antennae moving, needs fewer yet.
    buddy: { maxFps: 30, restFps: 15 },
    fireflies: () => firefliesOn,
    mount: addControls,
    // Anything that moves by itself would redraw the whole layer at the screen's
    // full rate, whatever the cat is holding to. Measured with the timer running:
    // the ring's pulse and this blur took 40% of a core and 8% of the graphics
    // card, and 1% and 0.2% without them. The blur has nothing behind it to blur
    // anyway: a see-through window does not see the programs underneath.
    styles: `
      .fw[data-running="true"] .ring-inner::after {
        animation: none;
      }
      .glass {
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
      }

      /* Beside the ×, and like it, only there while the pointer is on the widget. */
      .edge-btn {
        position: absolute;
        top: -7px;
        z-index: 3;
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--w-border);
        background: var(--w-pill);
        color: var(--w-subtle);
        opacity: 0;
        box-shadow: 0 4px 12px -4px var(--w-shadow-2);
      }
      .edge-btn svg {
        width: 13px;
        height: 13px;
      }
      .edge-quick {
        right: 19px;
      }
      .edge-fireflies {
        right: 45px;
      }
      .piece:hover .edge-btn,
      .piece:focus-within .edge-btn,
      .edge-btn[aria-pressed="true"]:not(.edge-fireflies) {
        opacity: 1;
      }
      .edge-btn:hover:not(:disabled) {
        color: var(--w-text);
        border-color: var(--w-border-strong);
      }
      .edge-btn[aria-pressed="true"] {
        color: var(--accent);
      }
      .edge-btn:disabled {
        opacity: 0;
      }
      .piece:hover .edge-btn:disabled {
        opacity: 0.4;
      }

      .quick-on-widget {
        margin-top: 14px;
      }
      .timer-piece[data-quick="true"] .task-card {
        display: none;
      }
    `,
    // Every piece closed with its ×: the layer has nothing left to show, and the
    // next click on the icon should open it again, not close it first.
    nothingShown: () => door.closeWidgets(),
  };

  const widget = () => document.getElementById(HOST_ID);

  /* ---------- The mouse ---------- */

  let through = true;
  let pressed = false;

  function followPointer(event) {
    // Whatever is in the widget's shadow root reads from out here as its host,
    // and the host itself has no size: this is true only over something drawn.
    const over = document.elementFromPoint(event.clientX, event.clientY) === widget();
    const next = !over && !pressed;
    if (next === through) return;
    through = next;
    door.clickThrough(through);
  }

  function release(event) {
    pressed = false;
    followPointer(event);
  }

  window.addEventListener("pointermove", followPointer, true);
  window.addEventListener("pointerup", release, true);
  window.addEventListener("pointercancel", release, true);

  /* ---------- The keyboard ---------- */

  let keyboard = false;
  let activeAtPress = null;

  const activeField = () => widget()?.shadowRoot?.activeElement || null;
  const isTyping = (node) => Boolean(node?.matches(TYPING));

  function askForKeyboard(wanted) {
    if (wanted === keyboard) return;
    keyboard = wanted;
    door.takeKeyboard(wanted);
  }

  // Asking on the press, before the click: the click is what opens the calendar
  // of a date field, and that must not lose its window to the focus arriving late.
  window.addEventListener("pointerdown", (event) => {
    pressed = true;
    activeAtPress = activeField();
    if (isTyping(event.composedPath()[0])) askForKeyboard(true);
  }, true);

  // "New task" opens the field and puts the cursor in it with a click, not a press.
  // A field that was already current does not count: it stays current after the
  // window loses the focus, and a click to drag the widget should not take it back.
  window.addEventListener("click", () => setTimeout(() => {
    const now = activeField();
    if (!isTyping(now)) askForKeyboard(false);
    else if (now !== activeAtPress) askForKeyboard(true);
  }), true);

  // Leaving a field can let the keyboard go, and only that. The same event comes
  // when the window itself loses the focus, with the field still current, and
  // asking again then would snatch the keyboard back from the other program.
  window.addEventListener("focusout", () => setTimeout(() => {
    if (!isTyping(activeField())) askForKeyboard(false);
  }), true);
  window.addEventListener("blur", () => askForKeyboard(false));
})();
