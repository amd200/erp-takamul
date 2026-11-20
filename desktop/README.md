# Takamul ERP — Desktop (Electron, offline)

The web build is bundled inside the app (no remote URL). The app runs a small local server
(`server.cjs`, `http://127.0.0.1:5301`) that only serves the build. The web app calls the backend (REST + SignalR) directly at `serverUrl`
(`config.json`), so the backend must allow that origin in its CORS rules with credentials (the server's `AllowAll` policy does),
and its refresh-token cookie is `SameSite=None; Secure`, so `serverUrl` should be `https`. A self-signed certificate is accepted for localhost only.
Keep `appPort` fixed: it is the origin the backend sees.

## Run / build (on Windows)
```
npm install
npm run desktop        # build web (mode "desktop") + open in Electron
npm run desktop:dist   # Windows installer (NSIS) -> release/
```

## Server address
Default: `https://localhost:5002` (`desktop/config.json`). After the first launch an editable copy is at
`%APPDATA%\Takamul ERP\config.json` (`serverUrl`, `appPort`); edit it and restart the app.
`TAKAMUL_SERVER_URL` env var overrides both.

## Silent receipt printing
Roll receipts (invoice, kitchen bon) go to the printer chosen in print settings without a dialog (Electron's silent print, page size set in microns to the roll's width and the receipt's height, scaleFactor 99). If no printer is chosen, it is not installed, or printing fails, the normal print dialog opens.
On the printer's driver, set the paper to the 80mm roll one (e.g. "80(72) x ...mm"), otherwise the output can be blank.

`printWidthMm` in `config.json` (default 72): the width the printer can really print on an 80mm roll. The page is the roll's width (80mm), and the
receipt keeps an equal margin on each side so that it fits inside this width. If the edges are still clipped, lower it (e.g. 68); if there is a
wide empty margin, raise it (up to 80). Restart the app after editing the file; unknown keys in an older copy are ignored.

### Diagnostics
Every silent print is logged (time, printer, build and options, page size, result) to `print.log` in `%APPDATA%\Takamul ERP`; the print
settings tab has a button that shows it in the explorer, and a notice tells the cashier the result. "ok" only means the job reached
the printer queue: Electron cannot know whether paper came out. The notice, the log and the window title carry the build marker
(`print-r9 · <build time> · 72mm sf99`), so you can tell which build is running.
