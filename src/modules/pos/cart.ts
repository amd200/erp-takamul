import { invoiceTotals } from "@/modules/sales/totals"
import type { CartDiscount, CartLine } from "./types"

/** Totals of the cart, worked out the same way the invoice screens do (tax included in the price or on top of it). */
export const cartTotals = (lines: CartLine[], discount: CartDiscount) => invoiceTotals(lines, discount.kind, discount.value)

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0)

/** Two lines are the same line when they sell the same item and unit at the same price, with the same additions and note. */
export const sameLine = (a: Pick<CartLine, "productId" | "unitId" | "name" | "extras" | "notes" | "unitPrice">, b: typeof a) =>
  a.productId === b.productId && a.unitId === b.unitId && a.unitPrice === b.unitPrice && a.name === b.name && a.notes === b.notes
  && a.extras.map((e) => e.id).sort().join() === b.extras.map((e) => e.id).sort().join()

let seq = 0
export const newLineKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`
