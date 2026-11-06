/*
 * The cat from buddy.js, unchanged, out wandering across the screen.
 *
 * The window ignores the mouse, so clicks reach the program underneath, but
 * Windows still reports where the pointer is. Over the cat — or while it is
 * being carried, when a quick hand can outrun it — the window takes the mouse
 * for as long as that lasts.
 */
const host = document.getElementById("cat");

const buddy = FireflyBuddy.create(host, {
  activity: "roam",
  from: { centerX: window.innerWidth / 2, bottom: window.innerHeight / 2 },
  // This runs all day beside other programs, and each frame costs the same
  // whatever the size of the window: measured, 30 a second takes half the
  // graphics card that 60 does, and a walk this slow looks no different.
  maxFps: 30,
});
buddy.sync({ enabled: true, running: false, night: true });

let through = true;

function followPointer(event) {
  const over = document.elementFromPoint(event.clientX, event.clientY)?.closest(".buddy-hit");
  const next = !over && !host.hasAttribute("data-carried");
  if (next === through) return;
  through = next;
  window.overlay.clickThrough(through);
}

window.addEventListener("pointermove", followPointer);
window.addEventListener("pointerup", followPointer);

// For the tests: lets them drive the cat by hand and read where it is.
window.__buddy = buddy;
window.__clickThrough = () => through;
