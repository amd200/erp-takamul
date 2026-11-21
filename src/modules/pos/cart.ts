import { editorLineOf, invoiceTotals } from "@/modules/sales/totals"
import type { ItemDto } from "@/modules/sales/types"
import type { CartDiscount, CartLine } from "./types"

/** Totals of the cart, worked out the same way the invoice screens do (tax included in the price or on top of it). */
export const cartTotals = (lines: CartLine[], discount: CartDiscount) => invoiceTotals(lines, discount.kind, discount.value)

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0)

/** Two lines are the same line when they sell the same item and unit at the same price, with the same additions and note. */
export const sameLine = (a: Pick<CartLine, "productId" | "unitId" | "productName" | "extras" | "notes" | "unitPrice">, b: typeof a) =>
  a.productId === b.productId && a.unitId === b.unitId && a.unitPrice === b.unitPrice && a.productName === b.productName && a.notes === b.notes
  && a.extras.map((e) => e.id).sort().join() === b.extras.map((e) => e.id).sort().join()

let seq = 0
export const newLineKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

/**
 * A table order's item as a cart line. The server sends the unit price before tax and the discount per unit, so an item
 * whose price includes tax is shown with it (and sent back without it), and a flat discount becomes the line's total.
 */
export const dineInLineOf = (d: ItemDto): CartLine => {
  const line = editorLineOf(d)
  const price = d.unitPrice ?? 0
  const inclusive = line.taxCalculation === 1
  return {
    ...line, unitPrice: inclusive ? Math.round(price * (1 + line.taxPercentage / 100) * 10000) / 10000 : price,
    ...(d.discountPercentage ? { discountKind: "percent" as const, discount: d.discountPercentage } : { discountKind: "value" as const, discount: (d.discountValue ?? 0) * d.quantity }),
    key: newLineKey(), notes: d.notes ?? "", extras: [], imageUrl: null,
  }
}
