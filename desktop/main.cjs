const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron")
const fs = require("node:fs")
const path = require("node:path")
const { createServer } = require("./server.cjs")

const WEB_ROOT = path.join(__dirname, "web") // the bundled build (npm run desktop:build)

/** Settings: bundled defaults, overridden by an editable copy in the user's data folder. */
function loadConfig() {
  const defaults = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"))
  const userFile = path.join(app.getPath("userData"), "config.json")
  if (!fs.existsSync(userFile)) fs.writeFileSync(userFile, JSON.stringify(defaults, null, 2))
  let user = {}
  try { user = JSON.parse(fs.readFileSync(userFile, "utf8")) } catch { /* keep defaults */ }
  return { ...defaults, ...user, serverUrl: process.env.TAKAMUL_SERVER_URL || user.serverUrl || defaults.serverUrl }
}

if (!app.requestSingleInstanceLock()) app.quit()

const installedPrinters = (webContents) => webContents.getPrintersAsync().then((list) => list.map((p) => p.name))

/** Prints `html` without a dialog on the named printer; false when the printer is not installed or printing fails. */
async function printSilently(webContents, html, printer) {
  if (!printer || !(await installedPrinters(webContents)).includes(printer)) return false
  const win = new BrowserWindow({ show: false })
  try {
    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html))
    return await new Promise((resolve) => win.webContents.print({ silent: true, deviceName: printer, printBackground: true }, (ok) => resolve(ok)))
  } catch {
    return false
  } finally {
    win.destroy()
  }
}

app.whenReady().then(() => {
  const config = loadConfig()
  const server = createServer({ webRoot: WEB_ROOT, serverUrl: config.serverUrl })
  const origin = `http://127.0.0.1:${config.appPort}`

  server.on("error", (e) => {
    dialog.showErrorBox("Takamul ERP", `Cannot start the app on port ${config.appPort}: ${e.message}`)
    app.quit()
  })

  server.listen(config.appPort, "127.0.0.1", () => {
    const win = new BrowserWindow({ width: 1366, height: 820, show: false, autoHideMenuBar: true, backgroundColor: "#ffffff", webPreferences: { preload: path.join(__dirname, "preload.cjs") } })
    ipcMain.handle("printers", () => installedPrinters(win.webContents))
    ipcMain.handle("print", (_, html, printer) => printSilently(win.webContents, html, printer))
    win.maximize()
    win.once("ready-to-show", () => win.show())
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith(origin)) return { action: "allow" } // e.g. print windows
      shell.openExternal(url)
      return { action: "deny" }
    })
    win.loadURL(origin)
  })

  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) { if (win.isMinimized()) win.restore(); win.focus() }
  })
})

app.on("window-all-closed", () => app.quit())
