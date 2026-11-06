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

    const quickButton = document.getElementById("quickTimerBtn");
    if (quickButton) {
      const words = i18n[data.pomodoro?.settings?.language] || i18n.uk;
      quickButton.title = words.quickTimerTitle;
      quickButton.setAttribute("aria-label", words.quickTimerTitle);
    }
  }

  const refresh = () => chrome.storage.local.get(KEYS).then(show);

  /*
   * The quick card for the timer's rhythm: from a button among the page's own
   * small ones, or a click on the time itself. In the fullscreen timer that button
   * fades with the rest of the corner, so the screen stays as clean as it was. The
   * compact main window already takes a click on the time to mean "unfold".
   */
  function addQuickTimer() {
    const corner = document.querySelector(".fs-corner");
    const dock = document.querySelector(".buddy-dock");
    const ring = document.getElementById("ring");
    if (!(corner || dock) || !ring) return;

    const button = document.createElement("button");
    button.id = "quickTimerBtn";
    button.type = "button";
    button.className = corner ? "fs-icon" : "dock-btn";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = FireflyQuickTimer.ICON;
    if (corner) corner.insertBefore(button, document.getElementById("settingsBtn"));
    else dock.append(button);

    const quick = FireflyQuickTimer.create(document.body, {
      className: "quick-page",
      onToggle: (open) => button.setAttribute("aria-pressed", String(open)),
    });

    button.addEventListener("click", () => quick.toggle());
    ring.addEventListener("click", () => {
      if (document.body.dataset.view !== "compact") quick.toggle();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!quick.isOpen()) return;
      const path = event.composedPath();
      if (![quick.element, button, ring].some((node) => path.includes(node))) quick.close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") quick.close();
    });
  }

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
    addQuickTimer();
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
