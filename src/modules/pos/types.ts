import type { DiscountKind, InvoiceLine } from "@/modules/sales/types"

/** The point of sale sells takeaway and delivery from this screen; dine-in (tables) is a separate flow. */
export type OrderType = "TakeAway" | "Delivery"

export type Extra = { id: number; name: string }

/** An invoice line plus what only the cashier's cart needs: a stable key, a note and the chosen additions. */
export type CartLine = InvoiceLine & { key: string; notes: string; extras: Extra[]; imageUrl: string | null }

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

export type SaleResult = { id: number | null; number: string | null }
