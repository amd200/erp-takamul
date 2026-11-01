/** Mirrors /sales-orders, /sales-returns and /debit-notes. */

export type Channel = "A4" | "POS"
export const PAYMENT_METHODS = ["Cash", "CreditCard", "DebitCard", "BankTransfer", "Check", "MobilePayment", "OnlinePayment", "Other"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Refunded"
export type ZatcaStatus = "NotSentYet" | "Sent" | "Rejected"
export type DiscountKind = "percent" | "value"

export type InvoiceLine = {
  productId: number
  /** The tax of the item, which purchase orders send by id. */
  taxId?: number
  /** The unit the item is sold in; the server needs it to price and take stock. */
  unitId: number
  name: string
  unitName: string
  quantity: number
  /** Price as entered on the item; `taxCalculation` says whether it includes tax. */
  unitPrice: number
  taxRate: number
  taxCalculation: 1 | 2
  discountKind: DiscountKind
  discount: number
  /** The active discount of the item's category; the server uses it instead of `discount`. A flat amount is per unit. */
  categoryDiscount?: { kind: DiscountKind; value: number }
  /** The invoice item's own id (what a return points back to) and how much of it earlier returns took, when it comes from a saved invoice. */
  itemId?: number
  returnedQuantity?: number
  /** What the server worked out for this line, when the line comes from a saved invoice. */
  amounts?: { discount: number; tax: number; total: number }
}

export type Payment = {
  id: number
  date: string
  amount: number
  method: PaymentMethod
  treasuryId: number
  notes: string
}

export type Totals = { subTotal: number; discount: number; tax: number; grandTotal: number }

export type InvoiceInput = {
  date: string
  customerId: number
  notes: string
  globalDiscountKind: DiscountKind
  globalDiscount: number
  warehouseId: number
  employeeId: number | null
  lines: InvoiceLine[]
  payments: Omit<Payment, "id" | "date">[]
}

/** The sales order, as /sales-orders sends it. */
export type ItemDto = {
  id?: number | null; returnedQuantity?: number | null; remainingQuantity?: number | null; notes?: string | null
  productId: number; productName?: string | null; unitId?: number | null; unitName?: string | null; quantity: number; unitPrice?: number | null
  priceBeforeTax?: number | null; taxPercentage?: number | null; taxAmount?: number | null; discountValue?: number | null; discountPercentage?: number | null; lineTotal?: number | null; taxCalculation?: number | null
}
export type PaymentDto = { id: number; amount: number; paymentMethod?: string | null; paymentDate?: string | null; notes?: string | null; treasuryId?: number | null; treasuryName?: string | null }
export type SalesOrderDto = {
  id: number; warehouseId?: number | null; orderNumber?: string | null; orderDate?: string | null; customerId?: number | null; customerName?: string | null; warehouseName?: string | null
  employeeName?: string | null; createdBy?: string | null; orderStatus?: string | null; subTotal?: number | null; taxAmount?: number | null; discountAmount?: number | null
  grandTotal?: number | null; paymentStatus?: string | null; zatcaStatus?: string | null; zatcaResponse?: string | null; notes?: string | null
  items?: ItemDto[] | null; payments?: PaymentDto[] | null; totalPaid?: number | null
}
/** A sales return, as /sales-returns sends it. */
export type ReturnItemDto = {
  id?: number; productId: number; productName?: string | null; unitName?: string | null; quantity: number; unitPrice?: number | null; unitId?: number | null
  taxPercentage?: number | null; taxAmount?: number | null; discountValue?: number | null; lineTotal?: number | null; taxCalculation?: number | null
}
export type SalesReturnDto = {
  id: number; returnNumber?: string | null; salesOrderId?: number | null; salesOrderNumber?: string | null; customerName?: string | null; returnDate?: string | null
  reason?: string | null; subTotal?: number | null; taxAmount?: number | null; discountAmount?: number | null; grandTotal?: number | null
  refundedAmount?: number | null; zatcaStatus?: string | null; zatcaResponse?: string | null; items?: ReturnItemDto[] | null
}

export type ReturnInput = {
  /** The invoice being returned, as the server sent it. */
  order: SalesOrderDto
  date: string
  reason: string
  /** Quantity to return for each line of the invoice, by line index. */
  quantities: number[]
  /** The money going back out, one entry per treasury it leaves from; empty keeps it as a credit note. */
  refunds: { treasuryId: number; amount: number }[]
  /** One key per return, so a double click or a retry creates it once. */
  key?: string
}

/** A debit note, as /debit-notes sends it. */
export type DebitNoteItemDto = {
  id?: number; productId: number; productName?: string | null; unitId?: number | null; unitName?: string | null; quantity: number; unitPrice?: number | null
  subTotal?: number | null; taxAmount?: number | null; lineTotal?: number | null; taxId?: number | null
}
export type DebitNoteDto = {
  id: number; debitNoteNumber?: string | null; salesOrderId?: number | null; salesOrderNumber?: string | null; customerName?: string | null; createdByName?: string | null; createdBy?: string | null
  issueDate?: string | null; subTotal?: number | null; taxAmount?: number | null; grandTotal?: number | null; reason?: string | null; zatcaStatus?: string | null; zatcaResponse?: string | null
  items?: DebitNoteItemDto[] | null; payments?: PaymentDto[] | null; totalPaid?: number | null
}

export type DebitNoteInput = { invoiceId: number; date: string; reason: string; lines: InvoiceLine[]; payments?: Omit<Payment, "id" | "date">[]; /** One key per note, so a double click or a retry saves it once. */ key?: string }

export type InvoiceQuery = { page: number; pageSize: number; searchTerm?: string; channel: Channel; sortBy?: string; sortDescending?: boolean }

/** An invoice from the recent list of both kinds; the A4 / POS split isn't in the invoice itself, so the list says which it came from. */
export type SalesOrderRow = SalesOrderDto & { channel: Channel }
