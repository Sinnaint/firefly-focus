const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlay", {
  clickThrough: (through) => ipcRenderer.send("click-through", through),
});
