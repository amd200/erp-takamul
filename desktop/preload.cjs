const { contextBridge, ipcRenderer } = require("electron")

// What the web app may ask of the desktop shell (nothing else of Electron is exposed).
contextBridge.exposeInMainWorld("desktop", {
  /** The backend address from config.json; the web app calls it directly (no local proxy). */
  serverUrl: ipcRenderer.sendSync("server-url"),
  /** Names of the printers installed on this computer. */
  printers: () => ipcRenderer.invoke("printers"),
  /** Prints the HTML silently on `printer`, on a page `widthPx` wide and as tall as the content; { ok, reason, size, info }: ok = the job reached the printer's queue (not that paper came out); info = build and print options used. */
  print: (html, printer, widthPx) => ipcRenderer.invoke("print", html, printer, widthPx),
  /** Shows the print log (print.log in the app data folder) in the file explorer. */
  openPrintLog: () => ipcRenderer.invoke("open-print-log"),
})
