/*
 * What the program adds to sidepanel.html and fullscreen.html, without those
 * pages knowing about it: its own words over the extension's, the settings that
 * only make sense here, and which cat is showing.
 *
 * main.js puts the controls into the page as it serves it, so the settings sheet
 * of the fullscreen timer gets them too, by fetching that same page. That is why
 * clicks are heard on the document: the sheet does not exist yet at this point.
 *
 * Like the theme and the language, these apply the moment they are changed. They
 * are not settings of the timer and do not go through service_worker.js.
 */
(() => {
  for (const [language, words] of Object.entries(DESKTOP_WORDS)) {
    if (i18n[language]) Object.assign(i18n[language], words.pages);
  }

  const KEYS = ["pomodoro", "desktopWidgetKind", "desktopLauncherHidden"];
  const isMainWindow = location.pathname === "/sidepanel.html";

  function show(data) {
    const kind = data.desktopWidgetKind || "full";
    const kindSelect = document.getElementById("desktopWidgetKind");
    if (kindSelect) kindSelect.value = kind;
    const launcherBox = document.getElementById("desktopLauncherShown");
    if (launcherBox) launcherBox.checked = !data.desktopLauncherHidden;

    // One cat at a time: while it is out on the layer, this window goes without.
    // The fullscreen timer always has its own, because the layer is shut for it.
    if (isMainWindow) {
      const outOnLayer = kind === "full" && data.pomodoro?.settings?.floatingWidgetEnabled !== false;
      document.body.dataset.catOnLayer = String(outOnLayer);
    }
  }

  const refresh = () => chrome.storage.local.get(KEYS).then(show);

  document.addEventListener("change", (event) => {
    if (event.target.id === "desktopWidgetKind") {
      chrome.storage.local.set({ desktopWidgetKind: event.target.value });
    } else if (event.target.id === "desktopLauncherShown") {
      chrome.storage.local.set({ desktopLauncherHidden: !event.target.checked });
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.id === "desktopQuit") window.fireflyHost.quit();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (KEYS.some((key) => changes[key])) refresh();
  });

  document.addEventListener("DOMContentLoaded", () => {
    refresh();
    // In the fullscreen timer the controls appear later, with the settings sheet.
    if (document.getElementById("desktopWidgetKind")) return;
    const watcher = new MutationObserver(() => {
      if (!document.getElementById("desktopWidgetKind")) return;
      watcher.disconnect();
      refresh();
    });
    watcher.observe(document.body, { childList: true, subtree: true });
  });
})();
