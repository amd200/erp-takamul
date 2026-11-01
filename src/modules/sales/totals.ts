import type { DiscountKind, InvoiceLine, ItemDto, Payment, PaymentStatus, SalesOrderDto, Totals } from "./types"

const round = (n: number) => Math.round(n * 100) / 100

/** One line, after its own discount: net (before tax), tax, total. */
export function lineAmounts(l: Pick<InvoiceLine, "quantity" | "unitPrice" | "taxRate" | "taxCalculation" | "discountKind" | "discount" | "categoryDiscount">) {
  const unitNet = l.taxCalculation === 1 ? l.unitPrice / (1 + l.taxRate / 100) : l.unitPrice
  const gross = unitNet * (l.quantity || 0)
  const c = l.categoryDiscount
  const want = c
    ? c.kind === "percent" ? (gross * c.value) / 100 : c.value * (l.quantity || 0)
    : l.discountKind === "percent" ? (gross * (l.discount || 0)) / 100 : l.discount || 0
  const discount = Math.min(gross, want)
  const net = gross - discount
  const tax = (net * l.taxRate) / 100
  return { gross: round(gross), discount: round(discount), net: round(net), tax: round(tax), total: round(net + tax) }
}

/**
 * Invoice totals. The invoice-level discount comes off the taxable base and reduces tax
 * proportionally, as the e-invoice rules require.
 */
export function invoiceTotals(lines: InvoiceLine[], globalKind: DiscountKind = "value", global = 0): Totals {
  const parts = lines.map(lineAmounts)
  const net = parts.reduce((s, p) => s + p.net, 0)
  const lineDiscounts = parts.reduce((s, p) => s + p.discount, 0)
  const tax = parts.reduce((s, p) => s + p.tax, 0)
  const g = Math.min(net, globalKind === "percent" ? (net * (global || 0)) / 100 : global || 0)
  const ratio = net > 0 ? (net - g) / net : 0
  return { subTotal: round(net + lineDiscounts), discount: round(lineDiscounts + g), tax: round(tax * ratio), grandTotal: round((net - g) + tax * ratio) }
}

export const paidOf = (payments: Pick<Payment, "amount">[]) => round(payments.reduce((s, p) => s + p.amount, 0))

export function paymentStatus(grandTotal: number, paid: number, returnedTotal = 0): PaymentStatus {
  if (returnedTotal > 0 && returnedTotal >= grandTotal) return "Refunded"
  if (paid <= 0) return "Unpaid"
  return paid + 0.005 >= grandTotal - returnedTotal ? "Paid" : "Partial"
}

/** The totals the server worked out for a saved invoice, in the shape the totals panel shows. */
export const orderTotals = (o: Pick<SalesOrderDto, "subTotal" | "discountAmount" | "taxAmount" | "grandTotal">): Totals =>
  ({ subTotal: o.subTotal ?? 0, discount: o.discountAmount ?? 0, tax: o.taxAmount ?? 0, grandTotal: o.grandTotal ?? 0 })

/** A saved invoice item as an editable line (held sales and debit notes start from the invoice's items). */
export const editorLineOf = (d: ItemDto): InvoiceLine => ({
  productId: d.productId, unitId: d.unitId ?? 0, name: d.productName ?? "", unitName: d.unitName ?? "", quantity: d.quantity,
  unitPrice: d.unitPrice ?? 0, taxRate: d.taxPercentage ?? 0, taxCalculation: d.taxCalculation === 3 ? 2 : 1, discountKind: "value", discount: d.discountValue ?? 0,
})
