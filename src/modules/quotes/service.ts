import { http } from "@/shared/http/request"
import { idempotencyHeaders, pinnedTo, retryWhileInProgress } from "@/shared/http/idempotency"
import type { PagedResult } from "@/shared/http/paged"
import { lineAmounts } from "@/modules/sales/totals"
import type { InvoiceLine } from "@/modules/sales/types"
import type { Quote, QuoteInput } from "./types"

/** The server takes the price before tax; a fixed discount is the line total (not per unit), as QuotationItem adds it. */
const itemBody = (l: InvoiceLine) => ({
  productId: l.productId,
  unitId: l.unitId || null,
  quantity: l.quantity,
  unitPrice: Math.round((l.taxCalculation === 1 ? l.unitPrice / (1 + l.taxPercentage / 100) : l.unitPrice) * 10000) / 10000,
  discountPercentage: l.discountKind === "percent" ? l.discount : 0,
  discountValue: l.discountKind === "value" ? l.discount : 0,
  taxPercentage: l.taxPercentage,
})

const stamp = (day: string, key?: string) => `${day}T${pinnedTo(key, () => new Date().toTimeString().slice(0, 8))}`

/** The server takes the invoice discount as an amount only, so a percentage is turned into one on the net of the lines. */
const globalDiscountAmount = (q: QuoteInput) => {
  if (q.globalDiscountKind !== "percent") return q.globalDiscount
  const net = q.lines.reduce((s, l) => s + lineAmounts(l).net, 0)
  return Math.round(((net * q.globalDiscount) / 100) * 100) / 100
}

const body = (q: QuoteInput, key?: string) => ({
  customerId: q.customerId,
  quotationDate: q.date.length > 10 ? q.date : stamp(q.date, key),
  globalDiscountAmount: globalDiscountAmount(q),
  shippingCost: q.shipping,
  notes: q.notes || null,
  items: q.lines.map(itemBody),
})

export const quotesApi = {
  page: async (p: { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }) => {
    return http<PagedResult<Quote>>("/Quotation", { params: { Page: p.page, PageSize: p.pageSize, SearchTerm: p.searchTerm || undefined, SortBy: p.sortBy, SortDescending: p.sortBy ? p.sortDescending : undefined } })
  },
  get: (id: number) => http<Quote>(`/Quotation/${id}`),
  create: (q: QuoteInput, key?: string) => retryWhileInProgress(() => http<unknown>("/Quotation", { method: "POST", headers: idempotencyHeaders(key), data: body(q, key) })),
  update: (id: number, q: QuoteInput) => http<unknown>(`/Quotation/${id}`, { method: "PUT", data: body(q) }),
  remove: (id: number) => http<unknown>(`/Quotation/${id}`, { method: "DELETE" }),
  duplicate: (id: number, key?: string) => retryWhileInProgress(() => http<unknown>(`/Quotation/${id}/duplicate`, { method: "POST", headers: idempotencyHeaders(key) })),
}

/** The invoice-level discount of a saved quotation: what the server took off beyond the lines' own discounts. */
export const quoteGlobalDiscount = (q: Quote) => {
  const lineDiscounts = (q.items ?? []).reduce((s, l) => s + (l.discountAmount ?? 0), 0)
  return Math.max(0, Math.round(((q.discountAmount ?? 0) - lineDiscounts) * 100) / 100)
}
