import type { InvoiceLine, PaymentDto, Totals } from "../types"

/**
 * What the invoice layouts print. Invoices, quotations and debit notes all print through the same layouts,
 * so the layouts take this one shape and each document hands over what it has.
 */
export type PrintInvoice = {
  id: number
  number: string
  date: string
  customerName: string
  warehouseName: string
  employeeName: string | null
  createdBy: string
  lines: InvoiceLine[]
  totals: Totals
  notes: string
  payments: Pick<PaymentDto, "paymentMethod" | "amount">[]
  paid: number
}
