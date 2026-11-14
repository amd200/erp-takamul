import { publicInvoiceApi, recordKey, type FollowedRecord } from "./service"

/** "no-push": the server subscription is unavailable, so the customer must keep the tracking page open. */
export type NotifyResult = "enabled" | "no-push" | "denied" | "unsupported" | "error"

const SW_URL = "/push-sw.js"

export const isNotificationSupported = () => typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
export const isPushSupported = () => isNotificationSupported() && "PushManager" in window

/** iPhone and iPad only deliver web notifications to a page that was added to the Home Screen. */
export function needsAddToHomeScreen() {
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
  return isIos && !standalone
}

const shownKey = (r: FollowedRecord) => `created-notified-${recordKey(r)}`
const wasShown = (r: FollowedRecord) => {
  try { return localStorage.getItem(shownKey(r)) === "1" } catch { return false }
}
const markShown = (r: FollowedRecord) => {
  try { localStorage.setItem(shownKey(r), "1") } catch { /* storage unavailable */ }
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/**
 * Registers the push subscription for `record`. Only a tap passes `local`, which shows the "order created" notification
 * once per record; the quiet re-registration (permission already granted) shows nothing.
 */
export async function enableInvoiceNotifications(record: FollowedRecord, local?: { title: string; body: string }): Promise<NotifyResult> {
  if (!isNotificationSupported()) return "unsupported"
  try {
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission
    if (permission !== "granted") return "denied"

    await navigator.serviceWorker.register(SW_URL)
    const registration = await navigator.serviceWorker.ready
    // Tapping it must open this customer's own record, not the site root (the back office sign-in).
    const target = new URL(window.location.href)
    for (const k of ["invoiceId", "orderRequestId", "pickup"]) target.searchParams.delete(k)
    Object.entries(record).forEach(([k, id]) => target.searchParams.set(k, String(id)))
    if (local && !wasShown(record)) {
      await registration.showNotification(local.title, {
        body: local.body,
        icon: "/qr-icon-192.png",
        badge: "/qr-icon-192.png",
        silent: false,
        requireInteraction: true,
        tag: `invoice-created-${recordKey(record)}`,
        data: { url: target.pathname + target.search },
      })
      markShown(record)
    }

    if (!isPushSupported()) return "no-push"
    try {
      const publicKey = await publicInvoiceApi.vapidPublicKey()
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) })
      const json = subscription.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return "no-push"
      await publicInvoiceApi.subscribe(record, { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
    } catch (error) {
      console.warn("Push subscription failed; only in-page tracking will work:", error)
      return "no-push"
    }
    return "enabled"
  } catch (error) {
    console.error("Enabling notifications failed:", error)
    return "error"
  }
}
