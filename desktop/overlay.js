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

  window.__FIREFLY_DESKTOP__ = {
    tasks: kind !== "timer",
    cat: kind === "full",
    words: DESKTOP_WORDS,
    // This runs all day beside other programs, and each frame costs the same
    // whatever the size of the window: measured, 30 a second takes half the
    // graphics card that 60 does, and a walk this slow looks no different. A cat
    // sitting still, with only its breath and antennae moving, needs fewer yet.
    buddy: { maxFps: 30, restFps: 15 },
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

  function askForKeyboard(wanted) {
    if (wanted === keyboard) return;
    keyboard = wanted;
    door.takeKeyboard(wanted);
  }

  function checkKeyboard() {
    const active = widget()?.shadowRoot?.activeElement;
    askForKeyboard(Boolean(active?.matches(TYPING)));
  }

  // Asking on the press, before the click: the click is what opens the calendar
  // of a date field, and that must not lose its window to the focus arriving late.
  window.addEventListener("pointerdown", (event) => {
    pressed = true;
    if (event.composedPath()[0]?.matches?.(TYPING)) askForKeyboard(true);
  }, true);

  // "New task" opens the field and puts the cursor in it with a click, not a press.
  window.addEventListener("click", () => setTimeout(checkKeyboard), true);
  window.addEventListener("focusout", () => setTimeout(checkKeyboard), true);
  window.addEventListener("blur", () => askForKeyboard(false));
})();
