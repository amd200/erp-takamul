import type { Payment, Totals } from "@/modules/sales/types"
import type { Purchase, PurchaseItemDto, PurchaseLine } from "./types"

/**
 * A saved purchase line as an editable one. Costs come back before tax, so the line is tax-exclusive;
 * the discount is per unit on the wire.
 */
export const purchaseLineOf = (d: PurchaseItemDto): PurchaseLine => ({
  productId: d.productId, taxId: d.taxId ?? undefined, unitId: d.unitId ?? 0, name: d.productName ?? "", unitName: d.unitName ?? "", quantity: d.quantity,
  unitPrice: d.priceBeforeTax ?? d.unitPrice ?? 0, taxRate: 0, taxCalculation: 2,
  discountKind: (d.discountPercentage ?? 0) > 0 ? "percent" : "value",
  discount: (d.discountPercentage ?? 0) > 0 ? d.discountPercentage ?? 0 : (d.discountValue ?? 0) * d.quantity,
  amounts: { discount: (d.discountValue ?? 0) * d.quantity, tax: d.taxAmount ?? 0, total: d.lineTotal ?? 0 },
  returnedQuantity: d.returnedQuantity ?? 0,
})

/** The payments of a saved purchase, as the form holds them. */
export const purchasePaymentsOf = (p: Purchase): Payment[] =>
  (p.payments ?? []).map((x, i) => ({ id: x.id ?? i, date: x.paymentDate ?? "", amount: x.amount, method: (x.paymentMethod ?? x.paymentType ?? "Other") as Payment["method"], treasuryId: x.treasuryId, notes: x.notes ?? "" }))

/** The totals the server worked out for a saved purchase, in the shape the totals panel shows. */
export const purchaseTotals = (p: Purchase): Totals => ({ subTotal: p.subTotal ?? 0, discount: p.discountAmount ?? 0, tax: p.taxAmount ?? 0, grandTotal: p.grandTotal ?? 0 })
