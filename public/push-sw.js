/* Shows the "your invoice is ready" Web Push and opens the receipt link when it is tapped. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  const raw = event.data ? event.data.text() : "";
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { payload = { body: raw }; }
  const title = payload.title || "Takamul";
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || "",
    icon: payload.icon || "/qr-icon-192.png",
    tag: payload.tag,
    data: payload.data || {},
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/qr", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client && "navigate" in client) { await client.navigate(url); return client.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});
