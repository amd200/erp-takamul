import type { DebitNoteDto, DebitNoteItemDto, InvoiceLine, PaymentMethod } from "../types"
import type { PrintInvoice } from "./printInvoice"
import { invoiceA4Doc, type InvoiceA4Options } from "./invoiceA4Doc"
import { invoiceRollDoc, type InvoiceRollOptions } from "./invoiceRollDoc"

export type DebitNotePrintOptions = InvoiceA4Options & Pick<InvoiceRollOptions, "grid" | "showUnits">

/** Keep the debit note's own items and amounts, using the selected invoice layouts. */
/** A debit note line: the server prices it before tax, so the rate is worked back from the tax amount. */
const printLineOf = (d: DebitNoteItemDto): InvoiceLine => {
  const net = d.subTotal ?? 0
  return {
    productId: d.productId, unitId: d.unitId ?? 0, name: d.productName ?? "", unitName: d.unitName ?? "", quantity: d.quantity,
    unitPrice: d.unitPrice ?? 0, taxRate: net > 0 ? Math.round(((d.taxAmount ?? 0) / net) * 1000) / 10 : 0, taxCalculation: 2, discountKind: "value", discount: 0,
    amounts: { discount: 0, tax: d.taxAmount ?? 0, total: d.lineTotal ?? 0 },
  }
}

export function debitNoteDoc(note: DebitNoteDto, paper: "a4" | "roll", options: DebitNotePrintOptions) {
  const paid = note.totalPaid ?? (note.payments != null ? note.payments.reduce((sum, p) => sum + p.amount, 0) : null)
  const invoice: PrintInvoice = {
    id: note.id, number: note.debitNoteNumber ?? "", date: note.issueDate ?? "", customerName: note.customerName ?? "",
    createdBy: note.createdByName ?? note.createdBy ?? "", employeeName: null, warehouseName: "",
    lines: (note.items ?? []).map(printLineOf),
    totals: { subTotal: note.subTotal ?? 0, discount: 0, tax: note.taxAmount ?? 0, grandTotal: note.grandTotal ?? 0 },
    notes: note.reason ?? "",
    payments: (note.payments ?? []).map((p) => ({ method: p.paymentMethod as PaymentMethod, amount: p.amount })), paid: paid ?? 0,
  }
  const labels = {
    documentTitle: { ar: "إشعار مدين", en: "DEBIT NOTE" },
    documentNumberLabel: { ar: "إشعار رقم", en: "Debit Note No." },
  }
  // Missing payment data must not be printed as a confirmed zero payment.
  const printOptions = { ...options, ...labels, showPaidAndRemaining: options.showPaidAndRemaining && paid != null }
  return paper === "roll" ? invoiceRollDoc(invoice, printOptions) : invoiceA4Doc(invoice, printOptions)
}
