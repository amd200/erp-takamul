import { fetchAllPages } from "@/shared/http/paged"
import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { type PagedResult } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import { lineAmounts } from "./totals"
import type { InvoicePaymentItem, DebitNoteDto, DebitNoteInput, InvoiceInput, InvoiceLine, Payment, ReturnInput, SalesOrderDto, SalesOrderRow, SalesReturnDto, InvoiceQuery } from "./types"


// The server takes the unit price before tax and a flat discount per unit, as the POS sends them.
const itemBody = (l: InvoiceLine) => ({
  productId: l.productId, unitId: l.unitId, quantity: l.quantity,
  unitPrice: l.taxCalculation === 1 ? Math.round((l.unitPrice / (1 + l.taxPercentage / 100)) * 10000) / 10000 : l.unitPrice,
  discountValue: l.discountKind === "value" && l.quantity > 0 ? l.discount / l.quantity : 0, discountPercentage: l.discountKind === "percent" ? l.discount : 0,
})

export const invoicesApi = {
  /** One page of the A4 or POS list; search is done by the server. */
  page: async (q: InvoiceQuery) => {
    return http<PagedResult<SalesOrderDto>>("/sales-orders", { params: { Page: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined, OrderType: q.channel, IsHold: false, SortBy: q.sortBy, SortDescending: q.sortBy ? q.sortDescending : undefined } })
  },
  /** Recent invoices of both kinds, for the screens that pick one (returns, debit notes). */
  list: async (): Promise<SalesOrderRow[]> => {
    const [a4, pos] = await Promise.all((["A4", "POS"] as const).map(async (channel) => (await invoicesApi.page({ page: 1, pageSize: 100, channel })).items.map((d) => ({ ...d, channel }))))
    return [...a4, ...pos]
  },
  get: (id: number) => http<SalesOrderDto>(`/sales-orders/${id}`),

  create: (input: InvoiceInput, idempotencyKey?: string) => retryWhileInProgress(() => http<{ message?: string; data?: { id?: number } }>("/sales-orders/a4", {
    method: "POST",
    headers: idempotencyHeaders(idempotencyKey),
    data: {
      customerId: input.customerId, warehouseId: input.warehouseId, notes: input.notes || null, orderDate: input.date,
      globalDiscountValue: input.globalDiscountKind === "value" ? input.globalDiscount : 0, globalDiscountPercentage: input.globalDiscountKind === "percent" ? input.globalDiscount : 0,
      isHolding: false, holdingOrderId: 0,
      items: input.lines.map(itemBody),
      payments: input.payments.map((p) => ({ paymentMethod: p.method, treasuryId: p.treasuryId, amount: p.amount, notes: p.notes || null })),
    },
  })),

  recordPayment: (invoiceId: number, p: Omit<Payment, "id" | "date"> & { paymentDate?: string }, idempotencyKey?: string) => retryWhileInProgress(() => http<unknown>("/sales-orders/record-payment", {
    method: "POST", headers: idempotencyHeaders(idempotencyKey),
    data: { salesOrderId: invoiceId, treasuryId: p.treasuryId, amount: p.amount, paymentMethod: p.method, paymentDate: p.paymentDate, notes: p.notes || null },
  })),
  payments: (invoiceId: number) => http<InvoicePaymentItem[]>(`/sales-orders/order/${invoiceId}`),
  deletePayment: (paymentId: number, idempotencyKey?: string) => retryWhileInProgress(() => http<unknown>(`/sales-orders/delete-payment/${paymentId}`, { method: "DELETE", headers: idempotencyHeaders(idempotencyKey) })),
  updateNotes: (invoiceId: number, notes: string) => http<unknown>(`/sales-orders/${invoiceId}/notes`, { method: "PUT", data: { notes } }),
  sendToZatca: (invoiceId: number) => http<unknown>("/zatca-invoices/sell", { method: "POST", data: { invoiceId } }),
  /** Phase 1 QR text (TLV base64) for an invoice that has none stored. POST /zatca-invoices/generate-qr */
  generateQr: (invoiceId: number) => http<{ qrCode?: string | null }>("/zatca-invoices/generate-qr", { method: "POST", data: { invoiceId } }),
  downloadXml: (id: number) => http<Blob>(`/sales-orders/${id}/zatca-xml`, { responseType: "blob" }),
  downloadExcel: (id: number) => http<Blob>(`/sales-orders/${id}/zatca-excel`, { responseType: "blob" }),
  downloadPdfA3: (saleId: number) => http<Blob>("/zatca-invoices/download-pdfa3", { method: "POST", data: { saleId, isSaleOrder: true }, responseType: "blob" }),
}

/** The warehouse a return goes back to is the invoice's; older answers only name it, so the name is matched. */
async function warehouseIdOf(order: SalesOrderDto) {
  if (order.warehouseId) return order.warehouseId
  const rows = await http<{ id: number; warehouseName?: string | null }[]>("/Warehouse")
  return rows.find((w) => w.warehouseName === order.warehouseName)?.id ?? 0
}

export const returnsApi = {
  list: (sort?: ListSort) => fetchAllPages<SalesReturnDto>("/sales-returns", { pageSize: 50, params: { ...sort } }),
  get: (id: number) => http<SalesReturnDto>(`/sales-returns/${id}`),
  create: async (input: ReturnInput) => {
    const items = input.lines.filter((l) => l.quantity > 0).map((l) => ({ originalItemId: l.originalItemId, productId: l.productId, unitId: l.unitId, quantity: l.quantity }))
    const refunds = input.refunds.filter((r) => r.amount > 0)
    const warehouseId = await warehouseIdOf(input.order)
    return retryWhileInProgress(() => http<{ id?: number }>("/sales-returns", {
      method: "POST", headers: idempotencyHeaders(input.key),
      data: {
        salesOrderId: input.order.id, warehouseId, returnDate: input.date, reason: input.reason || null,
        // Money goes back out of the treasury only when a refund was entered; otherwise it stays as a credit note.
        refundMethod: refunds.length ? "CashFromTreasury" : "CreditNote", discountAmount: 0, items,
        payments: refunds.map((r) => ({ paymentMethod: "Cash", treasuryId: r.treasuryId, amount: r.amount })),
      },
    }))
  },
  sendToZatca: (id: number) => http<unknown>("/zatca-invoices/sell-return", { method: "POST", data: { invoiceId: id } }),
  /** A refund paid to the customer against one return; `paymentDate` is a day (the server adds its own time). */
  recordRefund: (id: number, r: { treasuryId: number; amount: number; paymentDate?: string }, idempotencyKey?: string) =>
    retryWhileInProgress(() => http<unknown>(`/sales-returns/${id}/record-refund`, { method: "POST", headers: idempotencyHeaders(idempotencyKey), data: { treasuryId: r.treasuryId, amount: r.amount, paymentDate: r.paymentDate, paymentMethod: "Cash", notes: null } })),
  deleteRefund: (id: number, paymentId: number, idempotencyKey?: string) =>
    retryWhileInProgress(() => http<unknown>(`/sales-returns/${id}/refunds/${paymentId}`, { method: "DELETE", headers: idempotencyHeaders(idempotencyKey) })),
}

export const debitNotesApi = {
  list: (sort?: ListSort) => fetchAllPages<DebitNoteDto>("/debit-notes", { pageSize: 50, params: { ...sort } }),
  get: (id: number) => http<DebitNoteDto>(`/debit-notes/${id}`),
  create: async (input: DebitNoteInput) => retryWhileInProgress(() => http<{ id?: number }>("/debit-notes", {
    method: "POST", headers: idempotencyHeaders(input.key),
    data: {
      salesOrderId: input.invoiceId, issueDate: new Date(input.date).toISOString(), reason: input.reason,
      // The server wants the price before tax; the form may hold it with tax included.
      items: input.lines.map((l) => ({ productId: l.productId, unitId: l.unitId || null, quantity: l.quantity, unitPrice: lineAmounts(l).net / Math.max(l.quantity, 0.000001), taxId: l.taxId ?? null })),
      payments: (input.payments ?? []).map((p) => ({ treasuryId: p.treasuryId, amount: p.amount, notes: p.notes || "", paymentMethod: p.method })),
    },
  })),
  sendToZatca: (id: number) => http<unknown>("/zatca-invoices/debit-note", { method: "POST", data: { invoiceId: id } }),
}
