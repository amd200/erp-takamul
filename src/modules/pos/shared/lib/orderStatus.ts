import type { TFunction } from "i18next"
import type { Order } from "../../types"

/** The label of an order status for the POS lists (the raw status when it is not a known one). */
export const statusLabel = (t: TFunction, s?: string | null) => {
  switch (s?.toLowerCase()) {
    case "confirmed": case "completed": return t("pos1.statusCompleted")
    case "unconfirmed": case "pending": return t("pos1.statusPending")
    case "cancelled": return t("pos1.statusCancelled")
    case "inprogress": return t("pos1.statusInProgress")
    case "readyfordelivery": return t("pos1.readyForDelivery")
    default: return s
  }
}

export const badgeOf = (status?: string | null) => {
  const s = status?.toLowerCase()
  if (s === "confirmed") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
  if (s === "unconfirmed") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
  if (s === "cancelled") return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
  return "bg-sky-100 text-sky-600"
}

/** The list search box: number, customer or status contains the text (an empty text matches all). */
export const matchesOrderSearch = (o: Order, search: string) => {
  const q = search.trim().toLowerCase()
  return !q || !!(o.orderNumber?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.orderStatus?.toLowerCase().includes(q))
}
