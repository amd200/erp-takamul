/** Customer orders waiting at the counter (/sales-orders/requests), as the server sends them. Paying one turns it into a sales invoice. */
export type OrderRequest = {
  id: number
  orderNumber?: string | null
  status?: string | null
  customerId?: number | null
  customerName?: string | null
  customerPhone?: string | null
  orderDate?: string | null
  itemsCount?: number | null
  grandTotal?: number | null
  /** Set once the order has become an invoice. */
  salesOrderId?: number | null
}

export type OrderRequestItem = {
  productId?: number; unitId?: number | null; productName?: string | null; quantity: number; unitPrice?: number | null; taxPercentage?: number | null
  discountPercentage?: number | null; discountValue?: number | null; lineTotal?: number | null; notes?: string | null; additionIds?: number[] | null
}

export type OrderRequestDetails = OrderRequest & { notes?: string | null; items?: OrderRequestItem[] | null; subTotal?: number | null; taxAmount?: number | null; discountAmount?: number | null }

/** The body of POST / PUT /sales-orders/requests. */
export type OrderRequestInput = {
  customerId: number; notes: string | null
  items: { productId: number; quantity: number; discountPercentage: number; discountValue: number; notes: string | null; additionIds: number[] }[]
}
