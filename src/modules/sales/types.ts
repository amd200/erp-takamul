
export type Channel = "A4" | "POS"
export const PAYMENT_METHODS = ["Cash", "CreditCard", "DebitCard", "BankTransfer", "Check", "MobilePayment", "OnlinePayment", "Other"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Refunded"
export type ZatcaStatus = "NotSentYet" | "Sent" | "Rejected"
export type DiscountKind = "percent" | "value"

export type InvoiceLine = {
  productId: number
  taxId?: number
  unitId: number
  productName: string
  unitName: string
  quantity: number
  unitPrice: number
  taxPercentage: number
  taxCalculation: 1 | 2
  discountKind: DiscountKind
  discount: number
  categoryDiscount?: { kind: DiscountKind; value: number }
  itemId?: number
  returnedQuantity?: number
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
  lines: InvoiceLine[]
  payments: Omit<Payment, "id" | "date">[]
}

export type ItemDto = {
  id?: number | null; returnedQuantity?: number | null; remainingQuantity?: number | null; notes?: string | null
  productId: number; productName?: string | null; unitId?: number | null; unitName?: string | null; quantity: number; unitPrice?: number | null
  priceBeforeTax?: number | null; taxPercentage?: number | null; taxAmount?: number | null; discountValue?: number | null; discountPercentage?: number | null; lineTotal?: number | null; taxCalculation?: number | null
}
export type PaymentDto = { id: number; paymentNumber?: string | null; amount: number; paymentMethod?: string | null; paymentDate?: string | null; notes?: string | null; treasuryId?: number | null; treasuryName?: string | null }
export type InvoicePaymentItem = { id: number; paymentNumber?: string | null; paymentDate?: string | null; amount: number; paymentMethod?: string | null; status?: string | null; notes?: string | null; transactionName?: string | null }
export type SalesOrderDto = {
  id: number; warehouseId?: number | null; orderNumber?: string | null; orderDate?: string | null; customerId?: number | null; customerName?: string | null; warehouseName?: string | null
  employeeName?: string | null; createdBy?: string | null; branchId?: number | null; branchShortName?: string | null; orderStatus?: string | null; subTotal?: number | null; taxAmount?: number | null; discountAmount?: number | null
  grandTotal?: number | null; paymentStatus?: string | null; zatcaStatus?: string | null; zatcaResponse?: string | null; zatcaQRCode?: string | null; notes?: string | null
  items?: ItemDto[] | null; payments?: PaymentDto[] | null; totalPaid?: number | null
}
export type ReturnItemDto = {
  id?: number; productId: number; productName?: string | null; unitName?: string | null; quantity: number; unitPrice?: number | null; unitId?: number | null
  taxPercentage?: number | null; taxAmount?: number | null; discountValue?: number | null; lineTotal?: number | null; taxCalculation?: number | null
}
export type SalesReturnDto = {
  id: number; returnNumber?: string | null; salesOrderId?: number | null; salesOrderNumber?: string | null; customerName?: string | null; branchId?: number | null; branchShortName?: string | null; returnDate?: string | null
  reason?: string | null; subTotal?: number | null; taxAmount?: number | null; discountAmount?: number | null; grandTotal?: number | null
  refundedAmount?: number | null; zatcaStatus?: string | null; zatcaResponse?: string | null; items?: ReturnItemDto[] | null
  customerId?: number | null; employeeName?: string | null; createdBy?: string | null; zatcaQRCode?: string | null; payments?: PaymentDto[] | null
}

export type ReturnInput = {
  order: SalesOrderDto
  date: string
  reason: string
  quantities: number[]
  refunds: { treasuryId: number; amount: number }[]
  key?: string
}

export type DebitNoteItemDto = {
  id?: number; productId: number; productName?: string | null; unitId?: number | null; unitName?: string | null; quantity: number; unitPrice?: number | null
  subTotal?: number | null; taxAmount?: number | null; lineTotal?: number | null; taxId?: number | null
}
export type DebitNoteDto = {
  id: number; debitNoteNumber?: string | null; salesOrderId?: number | null; salesOrderNumber?: string | null; customerName?: string | null; createdByName?: string | null; createdBy?: string | null; branchName?: string | null
  issueDate?: string | null; subTotal?: number | null; taxAmount?: number | null; grandTotal?: number | null; reason?: string | null; zatcaStatus?: string | null; zatcaResponse?: string | null
  items?: DebitNoteItemDto[] | null; payments?: PaymentDto[] | null; totalPaid?: number | null
}

export type DebitNoteInput = { invoiceId: number; date: string; reason: string; lines: InvoiceLine[]; payments?: Omit<Payment, "id" | "date">[]; key?: string }

export type InvoiceQuery = { page: number; pageSize: number; searchTerm?: string; channel: Channel; sortBy?: string; sortDescending?: boolean }

export type SalesOrderRow = SalesOrderDto & { channel: Channel }
