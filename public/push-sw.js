/* Shows the order / invoice Web Push and opens the customer's receipt when it is tapped. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  const raw = event.data ? event.data.text() : "";
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { payload = { body: raw }; }
  const data = payload.data || {};
  // A pushed /qr link to the customer's own record means "ready for pickup": the page shows that heading.
  if (typeof data.url === "string") {
    try {
      const url = new URL(data.url, self.location.origin);
      const hasId = url.searchParams.has("invoiceId") || url.searchParams.has("orderRequestId");
      if (url.origin === self.location.origin && url.pathname === "/qr" && hasId) {
        url.searchParams.set("pickup", "1");
        data.url = url.href;
      }
    } catch { /* keep the original link */ }
  }
  const title = payload.title || "Takamul";
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || "",
    icon: payload.icon || "/qr-icon-192.png",
    badge: payload.badge || "/qr-icon-192.png",
    tag: payload.tag,
    renotify: !!payload.tag,
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: true,
    timestamp: Date.now(),
    data,
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
