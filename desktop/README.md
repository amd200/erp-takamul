# Takamul ERP — Desktop (Electron, offline)

The web build is bundled inside the app (no remote URL). The app runs a small local server
(`server.cjs`, `http://127.0.0.1:5301`) that serves the build and forwards `/api` and `/hubs`
(REST + SignalR) to the backend, so the browser sees one origin and there are no CORS problems.

## Run / build (on Windows)
```
npm install
npm run desktop        # build web (mode "desktop") + open in Electron
npm run desktop:dist   # Windows installer (NSIS) -> release/
```

## Server address
Default: `http://localhost:5002` (`desktop/config.json`). After the first launch an editable copy is at
`%APPDATA%\Takamul ERP\config.json` (`serverUrl`, `appPort`); edit it and restart the app.
`TAKAMUL_SERVER_URL` env var overrides both.
