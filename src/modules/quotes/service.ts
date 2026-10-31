import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import { lineAmounts } from "@/modules/sales/totals"
import type { InvoiceLine } from "@/modules/sales/types"
import type { Quote, QuoteInput } from "./types"

/** The server takes the price before tax and the discount per unit. */
const itemBody = (l: InvoiceLine) => ({
  productId: l.productId,
  unitId: l.unitId || null,
  quantity: l.quantity,
  unitPrice: Math.round((l.taxCalculation === 1 ? l.unitPrice / (1 + l.taxRate / 100) : l.unitPrice) * 10000) / 10000,
  discountPercentage: l.discountKind === "percent" ? l.discount : 0,
  discountValue: l.discountKind === "value" && l.quantity > 0 ? l.discount / l.quantity : 0,
  taxPercentage: l.taxRate,
})

const stamp = (day: string) => `${day}T${new Date().toTimeString().slice(0, 8)}`

const body = (q: QuoteInput) => ({
  customerId: q.customerId,
  quotationDate: q.date.length > 10 ? q.date : stamp(q.date),
  globalDiscountAmount: q.globalDiscount,
  shippingCost: q.shipping,
  notes: q.notes || null,
  items: q.lines.map(itemBody),
})

export const quotesApi = {
  page: async (p: { page: number; pageSize: number; searchTerm?: string }) => {
    const res = await http<PagedResult<Quote>>("/Quotation", { params: { Page: p.page, PageSize: p.pageSize, SearchTerm: p.searchTerm || undefined } })
    return { items: res.items, total: res.totalCount }
  },
  get: (id: number) => http<Quote>(`/Quotation/${id}`),
  create: (q: QuoteInput) => http<unknown>("/Quotation", { method: "POST", data: body(q) }),
  update: (id: number, q: QuoteInput) => http<unknown>(`/Quotation/${id}`, { method: "PUT", data: { ...body(q), validUntil: q.validUntil || null } }),
  remove: (id: number) => http<unknown>(`/Quotation/${id}`, { method: "DELETE" }),
  duplicate: (id: number) => http<unknown>(`/Quotation/${id}/duplicate`, { method: "POST" }),
}

/** What a line comes to, preferring the server's own figure when the line came from a saved quotation. */
export const lineTotal = (l: InvoiceLine) => l.amounts?.total ?? lineAmounts(l).total
