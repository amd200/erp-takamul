import { invoiceA4Doc, type InvoiceA4Options } from "@/modules/sales/print/invoiceA4Doc"
import type { PrintInvoice } from "@/modules/sales/print/printInvoice"
import { quoteLineOf, quoteTotals } from "../form"
import type { Quote } from "../types"

/** Print the quotation with the selected invoice design and quotation labels. */
export function quoteDoc(quote: Quote, options: InvoiceA4Options) {
  const invoice: PrintInvoice = {
    id: quote.id, number: quote.quotationNumber ?? String(quote.id), date: quote.quotationDate ?? "", customerName: quote.customerName ?? "",
    createdBy: quote.createdby ?? "", employeeName: null, warehouseName: "",
    lines: (quote.items ?? []).map(quoteLineOf), totals: quoteTotals(quote), notes: quote.notes ?? "",
    payments: [], paid: 0,
  }
  return invoiceA4Doc(invoice, {
    ...options,
    documentTitle: { ar: "عرض سعر", en: "QUOTATION" },
    documentNumberLabel: { ar: "عرض رقم", en: "Quote No." },
  })
}
