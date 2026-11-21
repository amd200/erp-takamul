import type { Product, TaxCalculation } from "./types"

export const numOr = (v: number | null | undefined, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d)
/** The server sends the tax calculation as a number: 1 = not applicable, 2 = price includes tax, 3 = tax on top. The form holds 1 = includes tax, 2 = on top. */
export const taxCalcOf = (d: Pick<Product, "taxCalculation">): TaxCalculation => (d.taxCalculation === 3 ? 2 : 1)
export const calcToServer = (c: TaxCalculation) => (c === 1 ? 2 : 3)

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

/** The price as it is entered and sold: with tax when the item is priced with tax, otherwise before it. */
export const enteredPrice = (d: Pick<Product, "taxCalculation" | "priceAfterTax" | "priceBeforeTax" | "sellingPrice">) =>
  numOr(taxCalcOf(d) === 1 ? d.priceAfterTax ?? d.sellingPrice : d.priceBeforeTax ?? d.sellingPrice)
/** The price a card or search result shows: with tax. */
export const listedPrice = (d: Pick<Product, "priceAfterTax" | "sellingPrice">) => numOr(d.priceAfterTax ?? d.sellingPrice)
/** Items shown on the sales screen: switched on, and never raw materials unless the server says so. */
export const showsInSales = (d: Pick<Product, "isActive" | "showInSalesScreen" | "productType">) => d.isActive !== false && (d.showInSalesScreen ?? d.productType !== "RawMatrial")
