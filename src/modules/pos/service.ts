import { http } from "@/shared/http/request"
import { fetchAllPages, type PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { CartLine, DeliveryCompany, HeldOrder, PosPayment, SaleInput, SaleResult } from "./types"

// A flat discount on a line is sent per unit, a percentage as is: the way the point-of-sale endpoints take it.
const itemBody = (l: CartLine) => ({
  productId: l.productId,
  unitId: l.unitId || null,
  quantity: l.quantity,
  unitPrice: l.unitPrice,
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

type SaleResponse = { data?: { id?: number; orderNumber?: string } | number | null }

const result = (res: SaleResponse | null | undefined): SaleResult => {
  const d = res?.data
  return typeof d === "number" ? { id: d, number: null } : { id: d?.id ?? null, number: d?.orderNumber ?? null }
}


export const posApi = {
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
