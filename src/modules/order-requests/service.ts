import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { PosPayment } from "@/modules/pos/types"
import type { CartLine } from "@/modules/pos/types"
import type { OrderRequestDetails, OrderRequest, OrderRequestInput } from "./types"

export const orderRequestsApi = {
  page: async (p: { page: number; pageSize: number; searchTerm?: string; from?: string; to?: string; sortBy?: string; sortDescending?: boolean }) => {
    return http<PagedResult<OrderRequest>>("/sales-orders/requests", { params: { Page: p.page, PageSize: p.pageSize, SearchTerm: p.searchTerm || undefined, From: p.from || undefined, To: p.to || undefined, SortBy: p.sortBy, SortDescending: p.sortBy ? p.sortDescending : undefined } })
  },
  get: (id: number) => http<OrderRequestDetails>(`/sales-orders/requests/${id}`),
  create: (data: OrderRequestInput) => http<OrderRequest>("/sales-orders/requests", { method: "POST", data }),
  update: (id: number, data: OrderRequestInput) => http<OrderRequestDetails>(`/sales-orders/requests/${id}`, { method: "PUT", data }),
  remove: (id: number) => http<unknown>(`/sales-orders/requests/${id}`, { method: "DELETE" }),
  markReady: (id: number) => http<unknown>(`/sales-orders/requests/${id}/mark-ready`, { method: "POST" }),
  checkout: (id: number, payments: PosPayment[], key: string) => retryWhileInProgress(() => http<unknown>("/sales-orders/requests/checkout", {
    method: "POST", headers: idempotencyHeaders(key),
    data: { requestOrderId: id, payments: payments.map((p) => ({ ...p, notes: null })) },
  })),
}

/**
 * The body the server takes from the point-of-sale cart. The customer is always a registered one (the server refuses an id together with a name / phone).
 * A fixed line discount is the line's total here (not per unit as the sale endpoints take it); the server prices the lines itself.
 */
export const orderRequestBody = (c: { lines: CartLine[]; customerId: number; note: string }): OrderRequestInput => ({
  customerId: c.customerId,
  notes: c.note.trim() || null,
  items: c.lines.map((l) => ({
    productId: l.productId, quantity: l.quantity,
    discountPercentage: l.discountKind === "percent" ? l.discount : 0, discountValue: l.discountKind === "value" ? l.discount : 0,
    notes: l.notes.trim() || null, additionIds: l.extras.map((e) => e.id),
  })),
})
