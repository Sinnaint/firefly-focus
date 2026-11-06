/* The narrow door between a page and the program around it; desktop/shim.js is what uses it. */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fireflyHost", {
  storageGet: (query) => ipcRenderer.invoke("storage-get", query),
  storageSet: (items) => ipcRenderer.invoke("storage-set", items),
  storageRemove: (keys) => ipcRenderer.invoke("storage-remove", keys),
  onStorageChanged: (fn) => ipcRenderer.on("storage-changed", (_event, changes) => fn(changes)),

  sendMessage: (message) => ipcRenderer.invoke("message", message),
  onEngineRequest: (fn) => ipcRenderer.on("engine-request", (_event, id, message) => fn(id, message)),
  engineReply: (id, value) => ipcRenderer.send("engine-reply", id, value),
  engineReady: () => ipcRenderer.send("engine-ready"),

  notify: (options) => ipcRenderer.send("notify", options),
  setBadge: (text) => ipcRenderer.send("badge", text),
  openFullscreen: () => ipcRenderer.send("open-fullscreen"),
  openLicenses: () => ipcRenderer.send("open-licenses"),
  appVersion: () => ipcRenderer.invoke("app-version"),
  quit: () => ipcRenderer.send("quit"),

  // The layer the widgets live on.
  clickThrough: (through) => ipcRenderer.send("click-through", through),
  takeKeyboard: (wanted) => ipcRenderer.send("take-keyboard", wanted),
  closeWidgets: () => ipcRenderer.send("close-widgets"),

  // The icon on the screen.
  launcherClick: () => ipcRenderer.send("launcher-click"),
  launcherMove: (x, y) => ipcRenderer.send("launcher-move", x, y),
  launcherMoved: () => ipcRenderer.send("launcher-moved"),
  launcherMenu: () => ipcRenderer.send("launcher-menu"),
});
