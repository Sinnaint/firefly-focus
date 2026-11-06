/*
 * The small icon that stays over every other program and shows how far the timer
 * has got. A click opens or closes the widgets, a drag moves it, the right button
 * opens the program's menu. It is drawn only when the ring has visibly moved.
 */
(() => {
  const door = window.fireflyHost;
  const mark = document.getElementById("mark");
  const arc = document.getElementById("arc");
  const spark = document.getElementById("spark");
  const RADIUS = 14;
  const CENTRE = 26;

  let state = null;
  let shown = -1;

  function clock(ms) {
    const seconds = Math.ceil(Math.max(0, ms) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function render() {
    if (!state?.settings) return;
    const minutes = {
      work: state.settings.workMinutes,
      shortBreak: state.settings.shortBreakMinutes,
      longBreak: state.settings.longBreakMinutes,
    }[state.mode];
    const total = minutes * 60000;
    const left = state.running ? state.endsAt - Date.now() : state.remainingMs ?? total;

    mark.title = `Firefly Focus · ${clock(left)}`;
    document.body.dataset.mode = state.mode;
    document.body.dataset.running = String(Boolean(state.running));

    // In half-percent steps: under a pixel on this ring, and for a long stage
    // that is one drawing every several seconds instead of one every second.
    const progress = Math.round(Math.min(1, Math.max(0, 1 - left / total)) * 200) / 2;
    if (progress === shown) return;
    shown = progress;
    arc.setAttribute("stroke-dasharray", `${progress} 100`);
    const angle = (progress / 100) * 2 * Math.PI - Math.PI / 2;
    spark.setAttribute("cx", (CENTRE + RADIUS * Math.cos(angle)).toFixed(2));
    spark.setAttribute("cy", (CENTRE + RADIUS * Math.sin(angle)).toFixed(2));
  }

  door.storageGet("pomodoro").then((data) => {
    state = data.pomodoro;
    render();
  });
  door.onStorageChanged((changes) => {
    if (!changes.pomodoro) return;
    state = changes.pomodoro.newValue;
    render();
  });
  setInterval(render, 1000);

  /* ---------- Click, drag, menu ---------- */

  let press = null;

  mark.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    press = { screenX: event.screenX, screenY: event.screenY, offsetX: event.clientX, offsetY: event.clientY, moved: false };
    mark.setPointerCapture(event.pointerId);
  });

  mark.addEventListener("pointermove", (event) => {
    if (!press) return;
    if (!press.moved && Math.hypot(event.screenX - press.screenX, event.screenY - press.screenY) < 4) return;
    press.moved = true;
    door.launcherMove(event.screenX - press.offsetX, event.screenY - press.offsetY);
  });

  mark.addEventListener("pointerup", () => {
    if (!press) return;
    if (press.moved) door.launcherMoved();
    else door.launcherClick();
    press = null;
  });

  mark.addEventListener("pointercancel", () => {
    if (press?.moved) door.launcherMoved();
    press = null;
  });

  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    door.launcherMenu();
  });
})();
