// Local web server inside the desktop app: serves the bundled web build and forwards
// /api and /hubs (REST + SignalR/WebSocket) to the backend. The browser only ever talks to
// this server (same origin), so there are no CORS problems.
const http = require("node:http")
const https = require("node:https")
const net = require("node:net")
const tls = require("node:tls")
const fs = require("node:fs")
const path = require("node:path")

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".pem": "application/x-pem-file", ".txt": "text/plain; charset=utf-8", ".map": "application/json",
}

const isProxied = (url) => /^\/(api|hubs)(\/|\?|$)/i.test(url)

/** Cookies set by the backend are meant for its own domain; make them valid for this local origin. */
function fixCookies(cookies) {
  return cookies.map((c) =>
    c.replace(/;\s*domain=[^;]*/i, "").replace(/;\s*secure/i, "").replace(/;\s*samesite=none/i, "; SameSite=Lax"))
}

function createServer({ webRoot, serverUrl }) {
  const target = new URL(serverUrl)
  const secure = target.protocol === "https:"
  const port = Number(target.port) || (secure ? 443 : 80)
  const hostHeader = target.host

  const forwardHeaders = (raw) => {
    const out = {}
    for (let i = 0; i < raw.length; i += 2) {
      const name = raw[i].toLowerCase()
      if (name === "host" || name === "origin" || name === "referer") continue
      out[raw[i]] = raw[i + 1]
    }
    out.host = hostHeader
    return out
  }

  const proxy = (req, res) => {
    const upstream = (secure ? https : http).request(
      { host: target.hostname, port, method: req.method, path: req.url, headers: forwardHeaders(req.rawHeaders) },
      (up) => {
        const headers = { ...up.headers }
        if (headers["set-cookie"]) headers["set-cookie"] = fixCookies(headers["set-cookie"])
        res.writeHead(up.statusCode ?? 502, headers)
        up.pipe(res)
      },
    )
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: "Cannot reach the server at " + serverUrl }))
    })
    req.pipe(upstream)
  }

  const serveStatic = (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname)
    let file = path.join(webRoot, pathname)
    if (file !== webRoot && !file.startsWith(webRoot + path.sep)) { res.writeHead(403); return res.end() }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // Real files (assets, images) must exist; any other path is a client-side route.
      if (path.extname(pathname)) { res.writeHead(404); return res.end() }
      file = path.join(webRoot, "index.html")
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" })
    fs.createReadStream(file).pipe(res)
  }

  const server = http.createServer((req, res) => (isProxied(req.url) ? proxy(req, res) : serveStatic(req, res)))

  // WebSocket (SignalR): open a raw connection to the backend and pipe both ways.
  server.on("upgrade", (req, socket, head) => {
    if (!isProxied(req.url)) return socket.destroy()
    const onConnect = () => {
      let text = `${req.method} ${req.url} HTTP/1.1\r\n`
      const headers = forwardHeaders(req.rawHeaders)
      for (const k of Object.keys(headers)) text += `${k}: ${headers[k]}\r\n`
      upstream.write(text + "\r\n")
      if (head?.length) upstream.write(head)
      socket.pipe(upstream)
      upstream.pipe(socket)
    }
    const upstream = secure
      ? tls.connect({ host: target.hostname, port, servername: target.hostname }, onConnect)
      : net.connect(port, target.hostname, onConnect)
    upstream.on("error", () => socket.destroy())
    socket.on("error", () => upstream.destroy())
    socket.on("close", () => upstream.destroy())
  })

  return server
}

module.exports = { createServer }
