import { invoiceTotals, lineAmounts } from "@/modules/sales/totals"
import type { InvoiceLine } from "@/modules/sales/types"
import type { CartDiscount } from "@/modules/pos/types"

/** A purchase line on the screen. Costs are entered before tax (tax is added on top). */
export type BuyLine = InvoiceLine & { key: string; /** For the code column only; not sent. */ barcode?: string; /** A note beside the line, as in the current system; the server has no field for it, so it is not sent. */ lineNote?: string }

let seq = 0
export const newBuyKey = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`

/**
 * The unit cost that makes a line come to `total` with its tax on top. Kept at full precision (as the current
 * system does) so the line total is exactly what was typed; screens only show it with two decimals.
 */
export function costFromTotal(total: number, quantity: number, taxPercentage: number) {
  return quantity > 0 ? total / (1 + taxPercentage / 100) / quantity : 0
}

/**
 * The purchase endpoint has no invoice discount, only per-line ones, so an invoice discount is sent as
 * the same percentage on every line, or an amount shared out by each line's value.
 */
export function spreadDiscount(lines: BuyLine[], d: CartDiscount): BuyLine[] {
  if (d.value <= 0) return lines
  if (d.kind === "percent") return lines.map((l) => ({ ...l, discountKind: "percent", discount: d.value }))
  const nets = lines.map((l) => lineAmounts({ ...l, discount: 0 }).net)
  const sum = nets.reduce((s, n) => s + n, 0)
  const amount = Math.min(d.value, sum)
  return lines.map((l, i) => ({ ...l, discountKind: "value", discount: sum > 0 ? Math.round((amount * nets[i]) / sum * 100) / 100 : 0 }))
}

export const buyTotals = (lines: BuyLine[], d: CartDiscount) => invoiceTotals(lines, d.kind, d.value)
