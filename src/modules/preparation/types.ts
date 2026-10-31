export type PrepItem = {
  productName?: string | null
  productNameEn?: string | null
  quantity: number
  notes?: string | null
  /** Additions chosen on the item (extra cheese, no onions...). */
  additions?: { additionNameAr?: string | null; additionNameEn?: string | null }[] | null
}

/** An invoice as the kitchen sees it (/sales-orders, as the server sends it): what to prepare, for which table, and how long it has been waiting. */
export type PrepOrder = {
  id: number
  orderNumber?: string | null
  orderDate?: string | null
  orderStatus?: string | null
  orderType?: string | null
  orderTypeName?: string | null
  tableNumber?: string | null
  /** The running number of the order on the day, shown big on the ticket. */
  salesOrderStartNumber?: string | number | null
  customerName?: string | null
  orderDeviceNumber?: string | number | null
  items?: PrepItem[] | null
}

/** The kitchen is done with an order once the server marks it ready for delivery. */
export const isReady = (o: Pick<PrepOrder, "orderStatus">) => String(o.orderStatus ?? "").trim().toLowerCase() === "readyfordelivery"
