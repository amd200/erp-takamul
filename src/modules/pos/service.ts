import { http } from "@/shared/http/request"
import { fetchAllPages, type PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { Order } from "./components/OrdersDialog"
import type { CartLine, DeliveryCompany, HeldOrder, PosPayment, SaleInput, SaleResult } from "./types"

// The server takes the unit price before tax; a line priced with tax (calculation 1) is divided by it first, as the old POS does.
const priceBeforeTax = (l: CartLine) => (l.taxCalculation === 1 ? Math.round((l.unitPrice / (1 + l.taxRate / 100)) * 10000) / 10000 : l.unitPrice)

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

const paymentBody = (p: PosPayment) => ({ paymentMethod: p.method, treasuryId: p.treasuryId, amount: p.amount, notes: null })

function body(s: SaleInput) {
  const common = {
    customerId: s.customerId, ...(s.customerCompanionId ? { customerCompanionId: s.customerCompanionId } : {}), warehouseId: s.warehouseId, employeeId: s.employeeId, orderDate: s.orderDate, notes: s.note || null,
    globalDiscountValue: s.discount.kind === "value" ? s.discount.value : 0, globalDiscountPercentage: s.discount.kind === "percent" ? s.discount.value : 0,
    isHolding: s.holding, holdingOrderId: s.holdingOrderId ?? 0,
    orderDeviceNumber: s.orderDeviceNumber ? Number(s.orderDeviceNumber) : null, TableNumber: s.tableNumber || null,
    // Gift cards are not here.
    posDeviceName: s.posDeviceName ?? null, giftCardId: null,
    items: s.lines.map(itemBody), payments: s.payments.map(paymentBody),
  }
  return s.orderType === "Delivery"
    ? { ...common, deliveryCompanyId: s.deliveryCompanyId }
    : { ...common, ...(s.orderTypeName ? { OrderTypeName: s.orderTypeName } : {}) }
}

type SaleResponse = { data?: { id?: number; orderNumber?: string; salesOrderStartNumber?: string | number | null } | number | null }

const result = (res: SaleResponse | null | undefined): SaleResult => {
  const d = res?.data
  return typeof d === "number" ? { id: d, number: null } : { id: d?.id ?? null, number: d?.orderNumber ?? null, startNumber: d?.salesOrderStartNumber ?? null }
}


const dineInBody = (s: SaleInput) => ({
  customerId: s.customerId, ...(s.customerCompanionId ? { customerCompanionId: s.customerCompanionId } : {}), warehouseId: s.warehouseId, tableId: s.tableId, employeeId: s.employeeId,
  orderDate: s.orderDate, notes: s.note || null, orderDeviceNumber: s.orderDeviceNumber ? Number(s.orderDeviceNumber) : null, items: s.lines.map(itemBody),
})

/** The dine-in endpoints: the order is sent to the kitchen unpaid, grows with more items, and is paid on the table. */
const dineIn = {
  /** `POST /sales-orders/pos/indine`: opens the table's order, no payment. */
  create: async (s: SaleInput, key: string): Promise<SaleResult> =>
    result(await retryWhileInProgress(() => http<SaleResponse>("/sales-orders/pos/indine", { method: "POST", headers: idempotencyHeaders(key), data: dineInBody(s), timeout: 60_000 }))),
  /** `PUT /sales-orders/pos/in-dine/{id}`: the server replaces the order's items with the ones sent, so the whole cart goes. */
  update: async (s: SaleInput): Promise<SaleResult> =>
    result(await http<SaleResponse>(`/sales-orders/pos/in-dine/${s.dineInOrderId}`, { method: "PUT", data: { items: s.lines.map(itemBody), notes: s.note || null }, timeout: 60_000 })),
  /** `POST /sales-orders/pos/indine/checkout`: pays the table's open order. */
  checkout: async (s: SaleInput, key: string): Promise<SaleResult> =>
    result(await retryWhileInProgress(() => http<SaleResponse>("/sales-orders/pos/indine/checkout", {
      method: "POST", headers: idempotencyHeaders(key), timeout: 60_000,
      data: {
        tableId: s.tableId, orderDate: s.orderDate, giftCardId: null,
        globalDiscountValue: s.discount.kind === "value" ? s.discount.value : 0, globalDiscountPercentage: s.discount.kind === "percent" ? s.discount.value : 0,
        payments: s.payments.map(paymentBody),
      },
    }))),
  /** The open order of a busy table, as /sales-orders sends one. */
  byTable: (tableId: number) => http<Order>(`/sales-orders/pos/indine/table/${tableId}`),
}

export const posApi = {
  dineIn,

  /** Saves a sale, or holds it when `holding` is set. The key makes a repeated send save it once. */
  save: async (s: SaleInput, key: string): Promise<SaleResult> =>
    result(await retryWhileInProgress(() => http<SaleResponse>(s.orderType === "Delivery" ? "/sales-orders/pos/delivery" : "/sales-orders/pos/takeaway", {
      method: "POST", headers: idempotencyHeaders(key), data: body(s), timeout: 60_000,
    }))),

  /** Turns a held order into a real sale by paying it. */
  release: async (id: number, payments: PosPayment[], key: string): Promise<SaleResult> =>
    result(await retryWhileInProgress(() => http<SaleResponse>(`/sales-orders/${id}/release-holding`, {
      method: "POST", headers: idempotencyHeaders(key), data: payments.map(paymentBody), timeout: 60_000,
    }))),

  held: async (): Promise<HeldOrder[]> => {
    const res = await http<PagedResult<HeldOrder>>("/sales-orders", { params: { Page: 1, PageSize: 100, OrderType: "POS", IsHold: true } })
    return res.items ?? []
  },
  deleteHeld: (id: number) => http<unknown>(`/sales-orders/${id}/delete-holding`, { method: "DELETE" }),

  deliveryCompanies: () => fetchAllPages<DeliveryCompany>("/settings/delivery-companies"),
}
