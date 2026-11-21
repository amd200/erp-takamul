import { useCallback } from "react"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { printDocument } from "@/shared/print"
import { bonDoc, ticketOptions } from "@/modules/preparation/bon"
import type { PrepOrder } from "@/modules/preparation/types"
import { useAppSettings } from "@/modules/settings"
import type { CartLine, SaleResult } from "./types"

/**
 * What the kitchen ticket carries, as the current POS decides it: the lines that were added to the order
 * (all of them for a new order); when something was removed or lowered, the whole cart under the "amendment" title.
 * Nothing changed, nothing to print.
 */
export function bonLines(cart: CartLine[], original: CartLine[]): { lines: CartLine[]; amended: boolean } | null {
  const current = cart.filter((l) => l.quantity > 0)
  const total = (list: CartLine[], id: number) => list.filter((l) => l.productId === id).reduce((s, l) => s + l.quantity, 0)
  const removed = original.some((o) => total(current, o.productId) < total(original, o.productId))
  if (removed) return { lines: current, amended: true }

  // Each line gives up what the order already had of its item, the rest is new.
  const had = new Map<number, number>()
  for (const o of original) had.set(o.productId, (had.get(o.productId) ?? 0) + o.quantity)
  const added = current.flatMap((l) => {
    const covered = Math.min(l.quantity, had.get(l.productId) ?? 0)
    had.set(l.productId, (had.get(l.productId) ?? 0) - covered)
    return l.quantity - covered > 0 ? [{ ...l, quantity: l.quantity - covered }] : []
  })
  return added.length ? { lines: added, amended: false } : null
}

export type BonSale = {
  cart: CartLine[]
  /** The lines the open order already had (adding to a dine-in order); empty for a new sale. */
  original?: CartLine[]
  /** The sale was only held, not paid. */
  held?: boolean
  customerName: string
  orderTypeName: string | null
  orderDeviceNumber: string | null
  tableNumber: string | null
  /** What the server answered; the order number falls back to `orderNumber` when it sent none. */
  result: SaleResult
  orderNumber?: string | null
}

/**
 * Prints the preparation ticket after a sale is saved, on the same conditions as the current POS:
 * never when the kitchen screen is on; a held sale only with "print preparation ticket on held orders" (printPreparedReceipt);
 * any other save only with "print preparation ticket" (saleBoneOrder). It is independent of "save and print" for the invoice.
 */
export function useKitchenBon() {
  const settings = useAppSettings()
  return useCallback((sale: BonSale) => {
    if (settings.preparationScreenTab?.enablePreparationScreen === true) return
    const wanted = sale.held ? settings.preparationTicketTab?.printPreparedReceipt : settings.preparationTicketTab?.saleBoneOrder
    if (wanted !== true) return
    const picked = bonLines(sale.cart, sale.original ?? [])
    if (!picked) return
    const order: PrepOrder = {
      id: sale.result.data?.id ?? 0,
      orderNumber: sale.result.data?.orderNumber ?? sale.orderNumber ?? null,
      orderTypeName: sale.orderTypeName,
      tableNumber: sale.tableNumber,
      salesOrderStartNumber: sale.result.data?.salesOrderStartNumber ?? null,
      customerName: sale.customerName,
      orderDeviceNumber: sale.orderDeviceNumber,
      items: picked.lines.map((l) => ({ productName: l.name, quantity: l.quantity, notes: l.notes || null, additions: l.extras.map((e) => ({ additionNameAr: e.name })) })),
    }
    // The ticket comes after the save: a failed print must not look like a failed sale.
    printDocument(bonDoc(order, { ...ticketOptions(settings, "pending", "print"), amended: picked.amended }))
      .catch(() => toast.error(i18n.t("posTables.bonFailed")))
  }, [settings])
}
