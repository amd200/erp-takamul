import type { InvoiceLine, PaymentDto, Totals } from "../types"

/** A line as it prints: its item note and the names of its additions, when the order has them. */
export type PrintLine = InvoiceLine & { notes?: string; additions?: string[] }

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
  lines: PrintLine[]
  totals: Totals
  notes: string
  payments: Pick<PaymentDto, "paymentMethod" | "amount">[]
  paid: number
  /** Restaurant data of a saved sale; printed on the roll when present. */
  startNumber?: number | null
  orderTypeName?: string | null
  tableNumber?: string | null
  deviceNumber?: number | null
}
