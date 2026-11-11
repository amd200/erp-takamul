import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { PosPayment } from "@/modules/pos/types"
import type { OrderRequestDetails, OrderRequest } from "./types"

export const orderRequestsApi = {
  page: async (p: { page: number; pageSize: number; searchTerm?: string; from?: string; to?: string; sortBy?: string; sortDescending?: boolean }) => {
    return http<PagedResult<OrderRequest>>("/sales-orders/requests", { params: { Page: p.page, PageSize: p.pageSize, SearchTerm: p.searchTerm || undefined, From: p.from || undefined, To: p.to || undefined, SortBy: p.sortBy, SortDescending: p.sortBy ? p.sortDescending : undefined } })
  },
  get: (id: number) => http<OrderRequestDetails>(`/sales-orders/requests/${id}`),
  remove: (id: number) => http<unknown>(`/sales-orders/requests/${id}`, { method: "DELETE" }),
  markReady: (id: number) => http<unknown>(`/sales-orders/requests/${id}/mark-ready`, { method: "POST" }),
  checkout: (id: number, payments: PosPayment[], key: string) => retryWhileInProgress(() => http<unknown>("/sales-orders/requests/checkout", {
    method: "POST", headers: idempotencyHeaders(key),
    data: { requestOrderId: id, payments: payments.map((p) => ({ paymentMethod: p.method, treasuryId: p.treasuryId, amount: p.amount, notes: null })) },
  })),
}
