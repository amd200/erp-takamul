import type { InvoiceLine, ReturnItemDto, SalesReturnDto } from "../types"
import type { PrintInvoice } from "./printInvoice"
import { invoiceA4Doc, type InvoiceA4Options } from "./invoiceA4Doc"
import { invoiceRollDoc, type InvoiceRollOptions } from "./invoiceRollDoc"

export type ReturnPrintOptions = InvoiceA4Options & Pick<InvoiceRollOptions, "grid" | "showUnits">

/** A return line: the unit price is worked back from the line's own amounts, so it is always the price before tax. */
const printLineOf = (d: ReturnItemDto): InvoiceLine => {
  const tax = d.taxAmount ?? 0
  const discount = d.discountValue ?? 0
  const total = d.lineTotal ?? 0
  const net = total - tax + discount
  return {
    productId: d.productId, unitId: d.unitId ?? 0, productName: d.productName ?? "", unitName: d.unitName ?? "", quantity: d.quantity,
    unitPrice: d.quantity > 0 ? net / d.quantity : d.unitPrice ?? 0, taxPercentage: d.taxPercentage ?? 0, taxCalculation: 2, discountKind: "value", discount,
    amounts: { discount, tax, total },
  }
}

/** The return's own items and amounts, through the selected invoice layouts. */
export function returnDoc(r: SalesReturnDto, paper: "a4" | "roll", options: ReturnPrintOptions) {
  const invoice: PrintInvoice = {
    id: r.id, number: r.returnNumber ?? "", date: r.returnDate ?? "", customerName: r.customerName ?? "",
    createdBy: r.createdBy ?? "", employeeName: r.employeeName ?? null, warehouseName: "",
    lines: (r.items ?? []).map(printLineOf),
    totals: { subTotal: r.subTotal ?? 0, discount: r.discountAmount ?? 0, tax: r.taxAmount ?? 0, grandTotal: r.grandTotal ?? 0 },
    notes: r.reason ?? "",
    payments: r.payments ?? [], paid: r.refundedAmount ?? 0,
  }
  const labels = {
    documentTitle: { ar: "إشعار دائن (مرتجع مبيعات)", en: "CREDIT NOTE" },
    documentNumberLabel: { ar: "مرتجع رقم", en: "Return No." },
  }
  const printOptions = { ...options, ...labels }
  return paper === "roll" ? invoiceRollDoc(invoice, printOptions) : invoiceA4Doc(invoice, printOptions)
}
