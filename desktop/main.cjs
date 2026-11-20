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

const MICRONS_PER_PX = 25400 / 96
const MM_PER_PX = 25.4 / 96
const SCALE_FACTOR = 99

// Which code is running: bump PRINT_REV when the printing code changes; the build time is written by `npm run desktop:build` (desktop/build.json).
const PRINT_REV = "print-r9"
const builtAt = () => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, "build.json"), "utf8")).built } catch { return "unknown build" } }
const buildInfo = () => `${PRINT_REV} · ${builtAt()}`

const printLog = () => path.join(app.getPath("userData"), "print.log")
const logPrint = (entry) => fs.appendFile(printLog(), JSON.stringify({ time: new Date().toISOString(), ...entry }) + "\n", () => {})

/**
 * Prints `html` without a dialog on the named printer, on a page as wide as the roll and as tall as its content (a roll has
 * no page height). Without an explicit page size the receipt printed cut off and split in two; with a page narrower than the
 * roll the driver enlarged it and cut both sides. So the page is the roll's width, and the receipt is kept inside the printable
 * `printWidthMm` by an equal margin on each side.
 * Resolves { ok, reason?, size }: ok means the job was handed to the printer's queue; Electron cannot tell whether paper came out.
 * When not ok the caller opens the print dialog.
 */
async function printSilently(webContents, html, printer, receiptPx, { printWidthMm }) {
  const widthPx = receiptPx
  // A roll is 80mm wide but its printer only prints the middle ~72mm (the driver's "80(72)" paper): the receipt gets a margin on each side so it stays inside.
  const insetMm = receiptPx < 400 ? Math.max(0, (widthPx * MM_PER_PX - printWidthMm) / 2) : 0
  const result = { ok: false, size: null }
  if (!printer) return { ...result, reason: "No printer chosen" }
  if (!(await installedPrinters(webContents)).includes(printer)) return { ...result, reason: "Printer not installed on this computer" }
  const win = new BrowserWindow({ show: false, width: Math.ceil(widthPx), height: 800, useContentSize: true })
  try {
    await win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html))
    if (insetMm) await win.webContents.insertCSS(`html,body{box-sizing:border-box}body{padding-left:${insetMm}mm!important;padding-right:${insetMm}mm!important}`)
    // Fonts and images must be ready, otherwise the page is measured before the text is laid out.
    const heightPx = await win.webContents.executeJavaScript(
      `Promise.all([document.fonts.ready, ...Array.from(document.images, (i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))]).then(() => document.documentElement.scrollHeight)`)
    result.size = `${Math.round(widthPx * MM_PER_PX)}×${Math.round((heightPx + 1) * MM_PER_PX)} mm`
    // Page size in microns (Electron needs both width and height), and a scaleFactor other than 100: reported to be what makes silent printing work on Windows thermal drivers (electron/electron#41928).
    const pageSize = { width: Math.round(widthPx * MICRONS_PER_PX), height: Math.round((heightPx + 1) * MICRONS_PER_PX) }
    return await new Promise((resolve) => win.webContents.print(
      { silent: true, deviceName: printer, printBackground: true, margins: { marginType: "none" }, scaleFactor: SCALE_FACTOR, pageSize },
      (ok, reason) => resolve({ ...result, ok, reason: ok ? undefined : reason || "Print failed" })))
  } catch (e) {
    return { ...result, reason: String(e?.message ?? e) }
  } finally {
    win.destroy()
  }
}

app.whenReady().then(() => {
  const config = loadConfig()
  const server = createServer({ webRoot: WEB_ROOT })
  const origin = `http://127.0.0.1:${config.appPort}`

  // The web app asks for the backend address when it starts (preload.cjs), and calls it directly.
  ipcMain.on("server-url", (e) => { e.returnValue = config.serverUrl })
  // A local backend usually has a self-signed certificate: accept it for localhost only, never for another host.
  const serverHost = new URL(config.serverUrl).hostname
  const isLocal = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(serverHost)
  app.on("certificate-error", (event, _wc, url, _error, _cert, callback) => {
    const ok = isLocal && new URL(url).hostname === serverHost
    if (ok) event.preventDefault()
    callback(ok)
  })

  server.on("error", (e) => {
    dialog.showErrorBox("Takamul ERP", `Cannot start the app on port ${config.appPort}: ${e.message}`)
    app.quit()
  })

  server.listen(config.appPort, "127.0.0.1", () => {
    const win = new BrowserWindow({ width: 1366, height: 820, show: false, autoHideMenuBar: true, backgroundColor: "#ffffff", webPreferences: { preload: path.join(__dirname, "preload.cjs") } })
    ipcMain.handle("printers", () => installedPrinters(win.webContents))
    win.on("page-title-updated", (e) => { e.preventDefault(); win.setTitle(`Takamul ERP — ${buildInfo()}`) })
    ipcMain.handle("print", async (_, html, printer, widthPx) => {
      const result = await printSilently(win.webContents, html, printer, widthPx, config)
      // `info` says which code and options produced this result; it is shown with the notice and kept in the log.
      const info = `${buildInfo()} · ${config.printWidthMm}mm sf${SCALE_FACTOR}`
      logPrint({ printer, info, ...result })
      return { ...result, info }
    })
    ipcMain.handle("open-print-log", () => { if (!fs.existsSync(printLog())) fs.writeFileSync(printLog(), ""); shell.showItemInFolder(printLog()) })
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
