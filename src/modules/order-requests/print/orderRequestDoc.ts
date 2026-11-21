import type { InvoiceLine } from "@/modules/sales/types"
import type { PrintInvoice } from "@/modules/sales/print/printInvoice"
import { invoiceRollDoc, type InvoiceRollOptions } from "@/modules/sales/print/invoiceRollDoc"
import type { OrderRequestDetails, OrderRequestItem } from "../types"

/** An order line: prices on the server's order are before tax, and the server's own tax and total are kept for display. */
const printLineOf = (d: OrderRequestItem): InvoiceLine => {
  const gross = (d.unitPrice ?? 0) * d.quantity
  const percent = d.discountPercentage ?? 0
  const discount = percent > 0 ? (gross * percent) / 100 : d.discountValue ?? 0
  const total = d.lineTotal ?? 0
  return {
    productId: d.productId ?? 0, unitId: d.unitId ?? 0, productName: d.productName ?? "", unitName: "", quantity: d.quantity,
    unitPrice: d.unitPrice ?? 0, taxPercentage: d.taxPercentage ?? 0, taxCalculation: 2,
    discountKind: percent > 0 ? "percent" : "value", discount: percent > 0 ? percent : discount,
    amounts: { discount, tax: total - (gross - discount), total },
  }
}

/** The customer's order on the 80mm roll, with the order's own number and title. */
export function orderRequestDoc(o: OrderRequestDetails, options: InvoiceRollOptions) {
  const invoice: PrintInvoice = {
    id: o.id, number: o.orderNumber ?? "", date: o.orderDate ?? "", customerName: o.customerName ?? "",
    createdBy: "", employeeName: null, warehouseName: "",
    lines: (o.items ?? []).map(printLineOf),
    totals: { subTotal: (o.subTotal ?? 0) + (o.discountAmount ?? 0), discount: o.discountAmount ?? 0, tax: o.taxAmount ?? 0, grandTotal: o.grandTotal ?? 0 },
    notes: o.notes ?? "", payments: [], paid: 0,
  }
  return invoiceRollDoc(invoice, {
    ...options,
    documentTitle: { ar: "طلب", en: "ORDER" },
    documentNumberLabel: { ar: "طلب رقم", en: "Order No." },
  })
}
