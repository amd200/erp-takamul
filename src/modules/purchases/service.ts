import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { InvoiceLine } from "@/modules/sales/types"
import type { Purchase, PurchaseInput } from "./types"

/** A day gets the current time; a date and time the user picked ("2026-10-31T14:05", from the second purchases screen) is kept. */
const stamp = (day: string) => (day.includes("T") ? (day.length === 16 ? `${day}:00` : day) : `${day}T${new Date().toTimeString().slice(0, 8)}`)

const itemBody = (l: InvoiceLine) => ({
  productId: l.productId,
  unitId: l.unitId,
  quantity: l.quantity,
  unitPrice: l.taxCalculation === 1 ? Math.round((l.unitPrice / (1 + l.taxPercentage / 100)) * 10000) / 10000 : l.unitPrice,
  discountPercentage: l.discountKind === "percent" ? l.discount : 0,
  discountValue: l.discountKind === "value" && l.quantity > 0 ? l.discount / l.quantity : 0,
  taxId: l.taxId,
})

function body(p: PurchaseInput) {
  const when = stamp(p.date)
  return {
    supplierId: p.supplierId, warehouseId: p.warehouseId, orderDate: when, notes: p.notes || null,
    items: p.lines.map(itemBody),
    payments: p.payments.map((x) => ({ paymentType: x.method, treasuryId: x.treasuryId, amount: x.amount, paymentDate: when, notes: x.notes || null })),
  }
}

export const purchasesApi = {
  page: async (p: { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }) => {
    return http<PagedResult<Purchase>>("/PurchaseOrder", { params: { Page: p.page, PageSize: p.pageSize, SearchTerm: p.searchTerm || undefined, SortBy: p.sortBy, SortDescending: p.sortBy ? p.sortDescending : undefined } })
  },
  get: (id: number) => http<Purchase>(`/PurchaseOrder/${id}`),
  create: (p: PurchaseInput, key?: string) => retryWhileInProgress(() => http<{ data?: Purchase; message?: string }>("/PurchaseOrder", { method: "POST", headers: idempotencyHeaders(key), data: body(p) })),
  update: (id: number, p: PurchaseInput) => http<unknown>(`/PurchaseOrder/${id}`, { method: "PUT", data: { ...body(p), expectedDeliveryDate: null } }),
  cancel: (id: number) => http<unknown>(`/PurchaseOrder/${id}`, { method: "DELETE" }),
  /** A payment to the supplier against one purchase (the server takes no date; it stamps it). */
  recordPayment: (id: number, p: { treasuryId: number; amount: number; notes?: string }) =>
    http<unknown>(`/PurchaseOrder/${id}/record-payment`, { method: "POST", data: { paymentType: "Cash", treasuryId: p.treasuryId, amount: p.amount, notes: p.notes || null } }),
  deletePayment: (paymentId: number) => http<unknown>(`/PurchaseOrder/payments/${paymentId}`, { method: "DELETE" }),
}
