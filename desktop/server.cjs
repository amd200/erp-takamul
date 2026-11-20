// Local web server inside the desktop app: only serves the bundled web build (the app is opened from http://127.0.0.1:<appPort>).
// The web app calls the backend directly at the configured server address (see main.cjs and src/shared/http/config.ts).
const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".pem": "application/x-pem-file", ".txt": "text/plain; charset=utf-8", ".map": "application/json",
}

function createServer({ webRoot }) {
  return http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname)
    // The app calls the backend directly; an /api or /hubs path here means a stale web build, so fail loudly instead of answering with index.html.
    if (/^\/(api|hubs)(\/|$)/i.test(pathname)) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("The app is not set to call the backend directly. Rebuild it: npm run desktop:build") }
    let file = path.join(webRoot, pathname)
    if (file !== webRoot && !file.startsWith(webRoot + path.sep)) { res.writeHead(403); return res.end() }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // Real files (assets, images) must exist; any other path is a client-side route.
      if (path.extname(pathname)) { res.writeHead(404); return res.end() }
      file = path.join(webRoot, "index.html")
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" })
    fs.createReadStream(file).pipe(res)
  })
}

module.exports = { createServer }
