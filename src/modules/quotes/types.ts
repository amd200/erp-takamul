import type { InvoiceLine } from "@/modules/sales/types"

export type QuoteItemDto = {
  productId: number
  productName?: string | null
  baseUnitId?: number | null
  baseUnitName?: string | null
  unitId?: number | null
  quantity: number
  unitPrice?: number | null
  priceBeforeTax?: number | null
  discountPercentage?: number | null
  discountAmount?: number | null
  taxPercentage?: number | null
  taxAmount?: number | null
  lineTotal?: number | null
}

/** Mirrors /Quotation, as the server sends it. */
export type Quote = {
  id: number
  quotationNumber?: string | null
  customerid?: number | null
  customerName?: string | null
  createdby?: string | null
  notes?: string | null
  quotationDate?: string | null
  subTotal?: number | null
  taxAmount?: number | null
  discountAmount?: number | null
  shippingCost?: number | null
  grandTotal?: number | null
  /** The server marks a quotation that is still open. */
  status?: boolean | null
  items?: QuoteItemDto[] | null
}

export type QuoteInput = {
  customerId: number
  date: string
  notes: string
  globalDiscount: number
  shipping: number
  lines: InvoiceLine[]
}
