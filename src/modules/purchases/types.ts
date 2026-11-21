import type { InvoiceLine, Payment } from "@/modules/sales/types"

export type PurchaseItemDto = {
  productId: number
  productName?: string | null
  unitId?: number | null
  unitName?: string | null
  quantity: number
  unitPrice?: number | null
  priceBeforeTax?: number | null
  discountPercentage?: number | null
  discountValue?: number | null
  taxId?: number | null
  taxAmount?: number | null
  lineTotal?: number | null
  returnedQuantity?: number | null
}
export type PurchasePaymentDto = { id?: number; amount: number; paymentDate?: string | null; paymentMethod?: string | null; paymentType?: string | null; notes?: string | null; treasuryId: number; treasuryName?: string | null }

/** Mirrors /PurchaseOrder, as the server sends it. Creating one also confirms and receives it, so stock goes up straight away. */
export type Purchase = {
  id: number
  purchaseOrderNumber?: string | null
  supplierId?: number | null
  supplierName?: string | null
  warehouseId?: number | null
  paymentStatus?: string | null
  notes?: string | null
  orderDate?: string | null
  subTotal?: number | null
  discountAmount?: number | null
  grandTotal?: number | null
  paidAmount?: number | null
  remainingAmount?: number | null
  taxAmount?: number | null
  items?: PurchaseItemDto[] | null
  payments?: PurchasePaymentDto[] | null
}

export type PurchaseInput = {
  supplierId: number
  warehouseId: number
  date: string
  notes: string
  lines: InvoiceLine[]
  payments: Omit<Payment, "id" | "date">[]
}
