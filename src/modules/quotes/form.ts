import type { InvoiceLine, Totals } from "@/modules/sales/types"
import type { Quote, QuoteItemDto } from "./types"

/** Prices come back before tax, so a saved line is an editable tax-exclusive one; what the server worked out is kept for display. */
export const quoteLineOf = (d: QuoteItemDto): InvoiceLine => ({
  productId: d.productId,
  unitId: d.unitId ?? d.baseUnitId ?? 0,
  name: d.productName ?? "",
  unitName: d.baseUnitName ?? "",
  quantity: d.quantity,
  unitPrice: d.priceBeforeTax ?? d.unitPrice ?? 0,
  taxRate: d.taxPercentage ?? 0,
  taxCalculation: 2,
  discountKind: (d.discountPercentage ?? 0) > 0 ? "percent" : "value",
  discount: (d.discountPercentage ?? 0) > 0 ? d.discountPercentage ?? 0 : d.discountAmount ?? 0,
  amounts: { discount: d.discountAmount ?? 0, tax: d.taxAmount ?? 0, total: d.lineTotal ?? 0 },
})

/** The invoice-level discount of a saved quotation: what the server took off beyond the lines' own discounts. */
export const quoteGlobalDiscount = (q: Quote) => {
  const lineDiscounts = (q.items ?? []).reduce((s, l) => s + (l.discountAmount ?? 0), 0)
  return Math.max(0, Math.round(((q.discountAmount ?? 0) - lineDiscounts) * 100) / 100)
}

/** The totals the server worked out for a saved quotation, in the shape the totals panel shows. */
export const quoteTotals = (q: Quote): Totals => ({ subTotal: q.subTotal ?? 0, discount: q.discountAmount ?? 0, tax: q.taxAmount ?? 0, grandTotal: q.grandTotal ?? 0 })
