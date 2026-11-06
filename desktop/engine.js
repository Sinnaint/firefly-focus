/*
 * Loads the timer and the audio code in order, telling the adapter whose
 * listeners are whose (see "messages" in shim.js), and says when it is ready
 * for the messages main.js has been holding.
 */
(async () => {
  const load = (src) =>
    new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = resolve;
      el.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(el);
    });

  window.__fireflyShim.setContext("engine");
  await load("/service_worker.js");
  window.__fireflyShim.setContext("offscreen");
  await load("/offscreen.js");
  window.__fireflyShim.setContext("engine");
  window.__fireflyShim.ready();
})();
