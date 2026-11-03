import type { DiscountKind, InvoiceLine } from "@/modules/sales/types"

/** What the cashier sells from the point of sale; "InDine" is the dine-in (tables) flow. */
export type OrderType = "TakeAway" | "InDine" | "Delivery"

/** A dine-in order is sent to the kitchen first ("new-order"), grows with "add-items", and is paid at "checkout". */
export type DineInMode = "new-order" | "add-items" | "checkout"

export type Extra = { id: number; name: string }

/** An invoice line plus what only the cashier's cart needs: a stable key, a note and the chosen additions. */
export type CartLine = InvoiceLine & { key: string; notes: string; extras: Extra[]; imageUrl: string | null; /** Set by the customer screen, which picks each extra by the item's category. */ categoryId?: number | null }

export type CartDiscount = { kind: DiscountKind; value: number }

/** A sale that was saved on hold (suspended) and can be released with payments later. */
/** A held sale, as /sales-orders sends it. */
export type HeldOrder = { id: number; orderNumber?: string | null; orderDate?: string | null; customerName?: string | null; grandTotal?: number | null; items?: unknown[] | null; notes?: string | null }

/** A delivery company, as /settings/delivery-companies sends it. */
export type DeliveryCompany = { id: number; name?: string | null }

export type PosPayment = { treasuryId: number; amount: number; method: import("@/modules/sales/types").PaymentMethod }

export type SaleInput = {
  orderType: OrderType
  /** The label picked before paying; sent with takeaway sales only. */
  orderTypeName?: string | null
  /** The pager number and the table number typed at the cashier; whole numbers as text, null when none. */
  orderDeviceNumber?: string | null
  tableNumber?: string | null
  /** The name the customer's own ordering screen (pos4) gives its device, from the address; null on the cashier screens. */
  posDeviceName?: string | null
  customerId: number | null
  /** Set when the measurement on the sale is a companion of the customer. */
  customerCompanionId?: number | null
  deliveryCompanyId: number | null
  /** Dine-in only: the table, the mode, and the open order of the table (add-items and checkout). */
  tableId?: number | null
  dineInMode?: DineInMode | null
  dineInOrderId?: number | null
  employeeId: number | null
  warehouseId: number
  lines: CartLine[]
  discount: CartDiscount
  note: string
  holding: boolean
  holdingOrderId: number | null
  payments: PosPayment[]
  orderDate: string
}

/** `startNumber` is the running number of the order on the day (setting "salesOrderStartNumber"), shown on the kitchen ticket. */
export type SaleResult = { id: number | null; number: string | null; startNumber?: string | number | null }
