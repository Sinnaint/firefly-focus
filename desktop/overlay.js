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
  const ICONS_KEY = "desktopCatIcons";
  const MOVES_KEY = "desktopCatMoves";
  const WINDOWS_KEY = "desktopCatWindows";
  const DEMO_KEY = "desktopCatDemo";
  const MODE_KEY = "pomodoroBuddyMode";

  const SPARK_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.5l1.9 6.6 6.6 1.9-6.6 1.9-1.9 6.6-1.9-6.6L3.5 12l6.6-1.9z"/></svg>';
  const SHOW_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"/><path d="M4.2 3l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3L1.2 6l2.3-.7z"/></svg>';

  /* ---------- What the program adds to the widget ---------- */

  // Off until asked for: moving by themselves, they redraw the whole layer at the
  // screen's full rate. With the timer alone on the layer, 10-20% of a core, not 1-2%.
  let firefliesOn = false;
  let timerState = null;
  let fireflyButton = null;
  let quickButton = null;
  let demoButton = null;
  let renderWidget = () => {};

  const wordsNow = () => DESKTOP_WORDS[timerState?.settings?.language] || DESKTOP_WORDS.uk;

  function labelButtons() {
    if (!fireflyButton) return;
    const words = wordsNow();
    demoButton.title = words.widget.demoTitle;
    demoButton.setAttribute("aria-label", words.widget.demoTitle);
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

  function addControls({ piece, taskCard, pill, render }) {
    widgetRoot = piece.parentNode;
    renderWidget = render;

    demoButton = document.createElement("button");
    demoButton.type = "button";
    demoButton.className = "pill-btn show-off";
    demoButton.innerHTML = SHOW_ICON;
    demoButton.addEventListener("click", () => chrome.storage.local.set({ [DEMO_KEY]: true }));
    pill.append(demoButton);
    startDemoIfDue();

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

  chrome.storage.local.get(["pomodoro", FIREFLIES_KEY, ICONS_KEY, MOVES_KEY, WINDOWS_KEY, DEMO_KEY]).then((data) => {
    timerState = data.pomodoro;
    firefliesOn = data[FIREFLIES_KEY] === true;
    movesWanted = data[MOVES_KEY] === true;
    ridesWanted = data[WINDOWS_KEY] !== false;
    labelButtons();
    if (kind === "full") {
      syncIcons(data[ICONS_KEY] === true);
      syncDemo(data[DEMO_KEY] === true);
    }
    followTimer();
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pomodoro?.newValue) {
      timerState = changes.pomodoro.newValue;
      followTimer();
    }
    if (changes[MOVES_KEY]) {
      movesWanted = changes[MOVES_KEY].newValue === true;
      // Taken back in the middle of a move: it drops what it has.
      if (!movesWanted && !demoRun) cat?.endOuting();
    }
    if (changes[WINDOWS_KEY]) {
      ridesWanted = changes[WINDOWS_KEY].newValue !== false;
      if (!ridesWanted && !demoRun && cat?.isRiding()) cat.endOuting();
    }
    if (changes[ICONS_KEY] && kind === "full") syncIcons(changes[ICONS_KEY].newValue === true);
    if (changes[DEMO_KEY] && kind === "full") syncDemo(changes[DEMO_KEY].newValue === true);
    labelButtons();
  });

  /* ---------- The cat and the icons on the desktop ---------- */

  /*
   * Only with the setting on, which is off to begin with: main.js then tells this
   * page where the icons are that can be seen right now. The cat is not really
   * behind them or on them, of course. It is drawn on this layer, over them, and
   * the real icons show through the layer wherever it draws nothing.
   */
  let cat = null;
  let iconsWanted = false;
  let movesWanted = false;
  let ridesWanted = false;
  let latestIcons = [];
  let widgetRoot = null;
  const iconImages = new Map();
  const biteMarks = new Map();

  /* Under the cat, which has to stay clickable, and over the demonstration's folders. */
  function underCat(node) {
    widgetRoot.querySelector(".floor").before(node);
  }

  // A chunk gone from the corner, with teeth marks round it.
  const BITE_MARK = `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(26 0) scale(.74)"><path d="M100 0v52c-8 4-15 2-19-5-7 5-15 3-19-4-7 4-15 1-17-7-8 1-14-5-13-13-6-3-9-9-7-16L27 0z" fill="rgba(24,12,34,.9)"/><path d="M100 52c-8 4-15 2-19-5-7 5-15 3-19-4-7 4-15 1-17-7-8 1-14-5-13-13-6-3-9-9-7-16" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="5" stroke-dasharray="7 5"/></g></svg>`;

  function markBitten(perch, catFacing) {
    if (!widgetRoot || biteMarks.has(perch.id)) return;
    // Over the whole icon with its label: while it is bitten, clicks stop here.
    const guard = document.createElement("div");
    guard.className = "icon-guard";
    guard.style.cssText = `left:${perch.cell.x}px;top:${perch.cell.y}px;width:${perch.cell.w}px;height:${perch.cell.h}px`;
    const mark = document.createElement("div");
    mark.className = "icon-bite";
    mark.innerHTML = BITE_MARK;
    // The chunk is gone from the corner the cat bit, on its own side of the icon.
    mark.style.cssText = `left:${perch.x - perch.cell.x}px;top:${perch.y - perch.cell.y}px;width:${perch.w}px;height:${perch.h}px${catFacing > 0 ? ";transform:scaleX(-1)" : ""}`;
    guard.append(mark);
    // Tried anyway: the cat is not impressed. Only it can give the icon back.
    guard.addEventListener("click", () => cat?.scold());
    guard.addEventListener("dblclick", () => cat?.scold());
    underCat(guard);
    biteMarks.set(perch.id, guard);
  }

  function unmarkBitten(perch) {
    const guard = biteMarks.get(perch.id);
    biteMarks.delete(perch.id);
    if (!guard) return;
    guard.style.pointerEvents = "none";
    const fading = guard.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: "ease-out" });
    fading.onfinish = () => guard.remove();
    fading.oncancel = () => guard.remove();
  }

  /* Hit by the ball: a copy of the icon jumps about on top of the real one for a moment. */
  async function wobbleIcon(perch, strength) {
    if (!widgetRoot) return;
    let source = iconImages.get(perch.id);
    if (source === undefined) {
      source = (await door.iconImage(perch.id).catch(() => null)) || null;
      iconImages.set(perch.id, source);
    }
    const spin = (4 + 14 * strength) * (Math.random() < 0.5 ? -1 : 1);
    const copy = document.createElement(source ? "img" : "div");
    copy.className = "icon-wobble";
    if (source) copy.src = source;
    copy.style.cssText = `left:${perch.x}px;top:${perch.y}px;width:${perch.w}px;height:${perch.h}px`;
    underCat(copy);
    const jolt = copy.animate(
      [
        { transform: "none" },
        { transform: `translateY(${-6 - 12 * strength}px) rotate(${spin}deg) scale(1.08)`, offset: 0.25 },
        { transform: `translateY(2px) rotate(${-spin * 0.6}deg) scale(0.97)`, offset: 0.55 },
        { transform: `rotate(${spin * 0.25}deg)`, offset: 0.8 },
        { transform: "none" },
      ],
      { duration: 620, easing: "ease-out" }
    );
    jolt.onfinish = () => copy.remove();
    jolt.oncancel = () => copy.remove();
  }

  /* The icons as last heard of: the cat may not exist yet when the first list comes. */
  function giveCatIcons() {
    if (!demoRun) cat?.setPerches(iconsWanted ? latestIcons : []);
  }

  function syncIcons(wanted) {
    if (wanted === iconsWanted) return;
    iconsWanted = wanted;
    door.watchIcons(wanted);
    giveCatIcons();
  }

  door.onDesktopIcons((icons) => {
    latestIcons = icons;
    giveCatIcons();
  });

  // Where the window it is sitting on has got to.
  door.onWindowMoved((info) => cat?.windowMoved(info));

  /*
   * Its teeth in an icon and walking off with it. The real icon follows along, a
   * dozen and more steps a second, which is as fast as the desktop needs to look
   * like it is gliding. Only its place on the desktop changes, as with a mouse drag.
   */
  const ICON_STEP_MS = 66;
  let lastIconStep = 0;

  function iconDragged(perch, x, y) {
    if (perch.fake) {
      demoRun?.moved(perch);
      return;
    }
    const now = performance.now();
    if (now - lastIconStep < ICON_STEP_MS) return;
    lastIconStep = now;
    door.moveIcon(perch.id, x, y);
  }

  function iconDropped(perch, x, y) {
    if (!perch.fake) door.dropIcon(perch.id, x, y);
  }

  /* ---------- The cat and the timer ---------- */

  let sessionsBefore = null;

  /* It keeps out of the way through a focus session, and is glad when one is done. */
  function followTimer() {
    if (!timerState) return;
    cat?.setFocus(Boolean(timerState.running && timerState.mode === "work"));
    const done = timerState.sessionsDone;
    if (sessionsBefore !== null && done > sessionsBefore) cat?.cheer();
    sessionsBefore = done;
  }

  /* ---------- Showing off ---------- */

  let demoWanted = false;
  let demoRun = null;

  function startDemoIfDue() {
    if (!demoWanted || demoRun || !cat || !widgetRoot) return;
    demoRun = FireflyCatDemo.start({
      cat,
      root: widgetRoot,
      say: wordsNow().widget,
      images: iconImages,
      under: underCat,
      onEnd: endDemo,
    });
  }

  async function endDemo() {
    demoRun = null;
    demoWanted = false;
    giveCatIcons();
    const data = await chrome.storage.local.get(MODE_KEY);
    cat?.setActivity(data[MODE_KEY] === "play" ? "ball" : "roam", { from: cat.whereabouts() });
    renderWidget();
    chrome.storage.local.set({ [DEMO_KEY]: false });
  }

  function syncDemo(wanted) {
    if (wanted === demoWanted) return;
    demoWanted = wanted;
    renderWidget();
    if (wanted) startDemoIfDue();
    else demoRun?.stop();
  }

  window.__FIREFLY_DESKTOP__ = {
    tasks: kind !== "timer",
    cat: kind === "full",
    words: DESKTOP_WORDS,
    showingOff: () => demoWanted,
    // This runs all day beside other programs, and each frame costs the same
    // whatever the size of the window: measured, 30 a second takes half the
    // graphics card that 60 does, and a walk this slow looks no different. A cat
    // sitting still, with only its breath and antennae moving, needs fewer yet.
    buddy: {
      maxFps: 30,
      restFps: 15,
      edges: true,
      onBite: markBitten,
      onBiteEnd: unmarkBitten,
      onBump: wobbleIcon,
      canDrag: () => movesWanted,
      onDragPlan: (perch) => (perch ? door.planIcon(perch.id) : null),
      onDrag: iconDragged,
      onDragEnd: iconDropped,
      canRide: () => ridesWanted,
      onSeats: () => door.windowSeats(),
      onRide: (id) => door.followWindow(id),
    },
    buddyReady(buddy) {
      cat = buddy;
      window.__FIREFLY_DESKTOP__.cat_ = buddy; // for the tests
      giveCatIcons();
      followTimer();
      startDemoIfDue();
    },
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

      .show-off svg {
        width: 17px;
        height: 17px;
      }

      ${FireflyCatDemo.STYLES}

      .icon-guard {
        position: fixed;
        cursor: not-allowed;
        pointer-events: auto;
      }
      .icon-bite {
        position: absolute;
        pointer-events: none;
      }
      .icon-bite svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .icon-wobble {
        position: fixed;
        pointer-events: none;
        will-change: transform;
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
