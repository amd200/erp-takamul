import { http } from "@/shared/http/request"
import { fetchAllPages, type PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { CartLine, DeliveryCompany, HeldOrder, Order, PosPayment, SaleInput, SaleResult } from "./types"

// The server takes the unit price before tax; a line priced with tax (calculation 1) is divided by it first, as the old POS does.
const priceBeforeTax = (l: CartLine) => (l.taxCalculation === 1 ? Math.round((l.unitPrice / (1 + l.taxPercentage / 100)) * 10000) / 10000 : l.unitPrice)

// A flat discount on a line is sent per unit, a percentage as is: the way the point-of-sale endpoints take it.
const itemBody = (l: CartLine) => ({
  productId: l.productId,
  unitId: l.unitId || null,
  quantity: l.quantity,
  unitPrice: priceBeforeTax(l),
  discountValue: l.discountKind === "value" && l.quantity > 0 ? l.discount / l.quantity : 0,
  discountPercentage: l.discountKind === "percent" ? l.discount : 0,
  notes: l.notes || null,
  additionIds: l.extras.map((e) => e.id),
})

function body(s: SaleInput) {
  const common = {
    customerId: s.customerId, ...(s.customerCompanionId ? { customerCompanionId: s.customerCompanionId } : {}), warehouseId: s.warehouseId, employeeId: s.employeeId, orderDate: s.orderDate, notes: s.note || null,
    globalDiscountValue: s.discount.kind === "value" ? s.discount.value : 0, globalDiscountPercentage: s.discount.kind === "percent" ? s.discount.value : 0,
    isHolding: s.holding, holdingOrderId: s.holdingOrderId ?? 0,
    orderDeviceNumber: s.orderDeviceNumber ? Number(s.orderDeviceNumber) : null, TableNumber: s.tableNumber || null,
    // Gift cards are not here.
    posDeviceName: s.posDeviceName ?? null, giftCardId: null,
    items: s.lines.map(itemBody), payments: s.payments.map((p) => ({ ...p, notes: null })),
  }
  return s.orderType === "Delivery"
    ? { ...common, deliveryCompanyId: s.deliveryCompanyId }
    : { ...common, ...(s.orderTypeName ? { OrderTypeName: s.orderTypeName } : {}) }
}

const dineInBody = (s: SaleInput) => ({
  customerId: s.customerId, ...(s.customerCompanionId ? { customerCompanionId: s.customerCompanionId } : {}), warehouseId: s.warehouseId, tableId: s.tableId, employeeId: s.employeeId,
  orderDate: s.orderDate, notes: s.note || null, orderDeviceNumber: s.orderDeviceNumber ? Number(s.orderDeviceNumber) : null, items: s.lines.map(itemBody),
})

/** The dine-in endpoints: the order is sent to the kitchen unpaid, grows with more items, and is paid on the table. */
const dineIn = {
  /** `POST /sales-orders/pos/indine`: opens the table's order, no payment. */
  create: (s: SaleInput, key: string): Promise<SaleResult> =>
    retryWhileInProgress(() => http<SaleResult>("/sales-orders/pos/indine", { method: "POST", headers: idempotencyHeaders(key), data: dineInBody(s), timeout: 60_000 })),
  /** `PUT /sales-orders/pos/in-dine/{id}`: the server replaces the order's items with the ones sent, so the whole cart goes. */
  update: (s: SaleInput): Promise<SaleResult> =>
    http<SaleResult>(`/sales-orders/pos/in-dine/${s.dineInOrderId}`, { method: "PUT", data: { items: s.lines.map(itemBody), notes: s.note || null }, timeout: 60_000 }),
  /** `POST /sales-orders/pos/indine/checkout`: pays the table's open order. */
  checkout: (s: SaleInput, key: string): Promise<SaleResult> =>
    retryWhileInProgress(() => http<SaleResult>("/sales-orders/pos/indine/checkout", {
      method: "POST", headers: idempotencyHeaders(key), timeout: 60_000,
      data: {
        tableId: s.tableId, orderDate: s.orderDate, giftCardId: null,
        globalDiscountValue: s.discount.kind === "value" ? s.discount.value : 0, globalDiscountPercentage: s.discount.kind === "percent" ? s.discount.value : 0,
        payments: s.payments.map((p) => ({ ...p, notes: null })),
      },
    })),
  /** The open order of a busy table, as /sales-orders sends one. */
  byTable: (tableId: number) => http<Order>(`/sales-orders/pos/indine/table/${tableId}`),
}

export const posApi = {
  dineIn,

  /** Saves a sale, or holds it when `holding` is set. The key makes a repeated send save it once. */
  save: (s: SaleInput, key: string): Promise<SaleResult> =>
    retryWhileInProgress(() => http<SaleResult>(s.orderType === "Delivery" ? "/sales-orders/pos/delivery" : "/sales-orders/pos/takeaway", {
      method: "POST", headers: idempotencyHeaders(key), data: body(s), timeout: 60_000,
    })),

  /** Turns a held order into a real sale by paying it. */
  release: (id: number, payments: PosPayment[], key: string): Promise<SaleResult> =>
    retryWhileInProgress(() => http<SaleResult>(`/sales-orders/${id}/release-holding`, {
      method: "POST", headers: idempotencyHeaders(key), data: payments.map((p) => ({ ...p, notes: null })), timeout: 60_000,
    })),

  held: async (): Promise<HeldOrder[]> => {
    const res = await http<PagedResult<HeldOrder>>("/sales-orders", { params: { Page: 1, PageSize: 100, OrderType: "POS", IsHold: true } })
    return res.items ?? []
  },
  /** The latest POS invoices (pass held to ask only for held / only for the rest; leave it out for both), as /sales-orders sends them. */
  orders: async (held?: boolean, size = 10): Promise<Order[]> =>
    (await http<PagedResult<Order>>("/sales-orders", { params: { Page: 1, PageSize: size, OrderType: "POS", ...(held === undefined ? {} : { IsHold: held }) } })).items ?? [],
  deleteHeld: (id: number) => http<unknown>(`/sales-orders/${id}/delete-holding`, { method: "DELETE" }),

  deliveryCompanies: () => fetchAllPages<DeliveryCompany>("/settings/delivery-companies"),
}
