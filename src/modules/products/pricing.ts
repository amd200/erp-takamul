import type { TaxCalculation } from "./types"

/** Price breakdown shown while editing. Same rule as the backend: taxCalculation 1 means the entered price already includes tax. */
export function priceBreakdown(price: number, rate: number, calc: TaxCalculation, cost: number) {
  const before = calc === 1 ? price / (1 + rate / 100) : price
  const tax = before * (rate / 100)
  const after = before + tax
  // Margin = final price (including tax) minus cost, as a percentage of the final price.
  const margin = after > 0 ? ((after - cost) / after) * 100 : 0
  return { before, tax, after, margin }
}

/** Cost of a prepared item: sum of each raw material's cost per base unit times the quantity used. */
export function componentsCost(components: { productId: number; quantity: number }[], costOf: (id: number) => number) {
  return components.reduce((sum, c) => sum + costOf(c.productId) * (c.quantity || 0), 0)
}
