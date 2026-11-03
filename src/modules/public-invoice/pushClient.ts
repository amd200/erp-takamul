import { publicInvoiceApi } from "./service"

/** "no-push": the local notification worked but the server subscription did not, so no later push will arrive. */
export type NotifyResult = "enabled" | "no-push" | "denied" | "unsupported" | "error"

const SW_URL = "/push-sw.js"

/** Which step of the subscription failed last (and why), so a "no-push" warning can say what to fix. */
let lastFailure = ""
export const pushFailure = () => lastFailure
const describe = (step: string, e: unknown) => {
  const status = (e as { response?: { status?: number } })?.response?.status
  const msg = e instanceof Error ? e.message : String(e)
  return `${step}: ${status ? `HTTP ${status}` : msg}`
}

export const isNotificationSupported = () => typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
export const isPushSupported = () => isNotificationSupported() && "PushManager" in window

/** iPhone and iPad only deliver web notifications to a page that was added to the Home Screen. */
export function needsAddToHomeScreen() {
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
  return isIos && !standalone
}

const shownKey = (invoiceId: number) => `created-notified-${invoiceId}`
const wasShown = (invoiceId: number) => {
  try { return localStorage.getItem(shownKey(invoiceId)) === "1" } catch { return false }
}
const markShown = (invoiceId: number) => {
  try { localStorage.setItem(shownKey(invoiceId), "1") } catch { /* storage unavailable */ }
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/**
 * Asks for permission (must run from a tap), shows the local "order created" notification through the service
 * worker (once per invoice), then registers the push subscription so the "invoice ready" push can arrive later.
 */
export async function enableInvoiceNotifications(invoiceId: number, local: { title: string; body: string }): Promise<NotifyResult> {
  if (!isNotificationSupported()) return "unsupported"
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission
    if (permission !== "granted") return "denied"

    await navigator.serviceWorker.register(SW_URL)
    const registration = await navigator.serviceWorker.ready
    // Tapping it must open this customer's own invoice.
    const target = new URL(window.location.href)
    target.searchParams.set("invoiceId", String(invoiceId))
    // Once per invoice: opening the page from the notification must not show it again.
    if (!wasShown(invoiceId)) {
      markShown(invoiceId)
      await registration.showNotification(local.title, {
        body: local.body,
        icon: "/qr-icon-192.png",
        tag: `invoice-created-${invoiceId}`,
        data: { url: target.pathname + target.search },
      })
    }

    if (!isPushSupported()) { lastFailure = "PushManager is not available in this browser"; return "no-push" }
    let step = "GET /push/vapid-public-key"
    try {
      const publicKey = await publicInvoiceApi.vapidPublicKey()
      step = "pushManager.subscribe"
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) { lastFailure = "pushManager.subscribe: subscription has no keys"; return "no-push" }
      step = "POST /push/subscriptions"
      await publicInvoiceApi.subscribe(invoiceId, { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
    } catch (error) {
      lastFailure = describe(step, error)
      console.warn("Push subscription failed at", lastFailure, error)
      return "no-push"
    }
    return "enabled"
  } catch (error) {
    console.error("Enabling notifications failed:", error)
    return "error"
  }
}
