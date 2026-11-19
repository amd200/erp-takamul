const { contextBridge, ipcRenderer } = require("electron")

// What the web app may ask of the desktop shell (nothing else of Electron is exposed).
contextBridge.exposeInMainWorld("desktop", {
  /** Names of the printers installed on this computer. */
  printers: () => ipcRenderer.invoke("printers"),
  /** Prints the HTML silently on `printer`; false when that printer does not exist here or printing failed. */
  print: (html, printer) => ipcRenderer.invoke("print", html, printer),
})
