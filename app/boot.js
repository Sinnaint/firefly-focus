/*
 * App shell boot.
 *
 * The app has no markup of its own: it borrows the extension's real pages so
 * there is never a second copy of the timer, the task list or the settings
 * form to keep in sync. This script pulls one of them in, then loads the
 * extension's own scripts against the adapter in app/shim.js.
 *
 * Load order matters and is the reason this is a script rather than a few
 * <script> tags: shared.js and buddy.js must come before the page script, and
 * the engine (service_worker.js) must be tagged before the audio code so
 * messages addressed to "offscreen" can be told apart.
 */
async function bootFireflyApp({ page, script }) {
  const markup = await (await fetch(page)).text();
  const parsed = new DOMParser().parseFromString(markup, "text/html");

  for (const attr of parsed.body.attributes) {
    document.body.setAttribute(attr.name, attr.value);
  }
  document.body.classList.add("is-app");

  // Inline <script> tags do not run when injected this way; drop them anyway
  // so the real load order below is the only one.
  parsed.body.querySelectorAll("script").forEach((el) => el.remove());
  document.body.append(...parsed.body.childNodes);

  const load = (src) =>
    new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(el);
    });

  await load("shared.js");
  await load("buddy.js");

  window.__fireflyShim.setContext("engine");
  await load("service_worker.js");

  window.__fireflyShim.setContext("offscreen");
  await load("offscreen.js");

  window.__fireflyShim.setContext("engine");
  await load(script);

  askForNotificationsOnFirstStart();
  registerServiceWorker();
}

/*
 * Asking on load gets auto-dismissed by Chrome and the answer sticks. Pressing
 * Start is the moment the permission actually means something, so ask there.
 */
function askForNotificationsOnFirstStart() {
  const start = document.getElementById("startBtn");
  if (!start || !("Notification" in window)) return;

  start.addEventListener(
    "click",
    () => {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    },
    { once: true }
  );
}

/* Offline is the whole point of installing it — register once, quietly. */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  navigator.serviceWorker.register("sw.js").catch((error) => {
    console.warn("Offline cache unavailable:", error);
  });
}
