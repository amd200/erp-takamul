import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import i18n from "@/shared/i18n"
import { http } from "@/shared/http/request"
import { formatMoney } from "@/lib/format"
import { downloadCsv } from "./export"
import type { Column, Row } from "./types"

/** GET /reports/CustomerMovement: what a customer bought, product by product, with their running totals. */
export type CustomerMovementItem = {
  date: string
  invoiceNumber: string
  customerCompanionId: number | null
  customerCompanionName: string | null
  productName: string
  quantity: number
  salesTotal: number
}

export type CustomerMovementResponse = {
  totalDebit: number
  totalCredit: number
  indebtedness: number
  items: CustomerMovementItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export type CustomerMovementParams = { customerId: number; from: string; to: string; page: number; pageSize: number; sortBy?: string; sortDescending?: boolean }

export const customerMovementApi = {
  get: (p: CustomerMovementParams) => http<CustomerMovementResponse>("/reports/CustomerMovement", {
    params: { CustomerId: p.customerId, From: p.from, To: p.to, Page: p.page, PageSize: p.pageSize, SortBy: p.sortBy ?? "date", SortDescending: p.sortDescending ?? true },
  }),
  /** Every page, for printing and Excel. */
  all: async (p: Omit<CustomerMovementParams, "page" | "pageSize">) => {
    const items: CustomerMovementItem[] = []
    for (let page = 1; page < 500; page++) {
      const res = await customerMovementApi.get({ ...p, page, pageSize: 100 })
      items.push(...(res.items ?? []))
      if (!res.items?.length || items.length >= res.totalCount) break
    }
    return items
  },
}

export const useCustomerMovement = (p: CustomerMovementParams | null) => useQuery({
  queryKey: ["reports", "customer-movement", p],
  queryFn: () => customerMovementApi.get(p!),
  enabled: p != null,
  placeholderData: (prev) => prev,
})

/** The report title, as shown on screen and at the top of the printout. */
export const movementTitle = (t: TFunction, customerName: string) => (customerName ? `${t("reports.movement.title")}/ ${customerName}` : t("reports.movement.title"))

const COLUMNS: Column[] = [
  { id: "serial", kind: "number" }, { id: "date", kind: "date" }, { id: "invoiceNumber", kind: "text" },
  { id: "productName", kind: "text" }, { id: "soldQty", kind: "number" }, { id: "salesTotal", kind: "money", strong: true },
]
const toRows = (items: CustomerMovementItem[]): Row[] => items.map((r, i) => ({ serial: i + 1, date: r.date, invoiceNumber: r.invoiceNumber, productName: r.productName, soldQty: r.quantity, salesTotal: r.salesTotal }))

export function exportMovementExcel(name: string, items: CustomerMovementItem[], t: TFunction) {
  downloadCsv(name, { stats: [], columns: COLUMNS, rows: toRows(items) }, t, i18n.language)
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)

/** Prints the report from a hidden frame (choose "Save as PDF" in the print dialog for a PDF). */
export function printMovement(o: { title: string; filters: string; cards: { label: string; value: string }[]; items: CustomerMovementItem[]; t: TFunction }) {
  const { t } = o
  const day = (d: string) => (d ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(d)) : "—")
  const head = ["serial", "date", "invoiceNumber", "productName", "soldQty", "salesTotal"].map((c) => `<th>${esc(t(`reports.c.${c}`))}</th>`).join("")
  const body = o.items.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(day(r.date))}</td><td>${esc(r.invoiceNumber)}</td><td>${esc(r.productName)}</td><td>${r.quantity}</td><td>${formatMoney(r.salesTotal)}</td></tr>`).join("")
  const cards = o.cards.map((c) => `<div class="k"><div class="s">${esc(c.label)}</div><b>${esc(c.value)}</b></div>`).join("")
  const doc = `<!doctype html><html dir="${i18n.dir()}"><head><meta charset="utf-8"><title>${esc(o.title)}</title><style>
@page{margin:0}*{box-sizing:border-box}body{margin:0;padding:12mm;font:12px/1.5 Cairo,Tahoma,sans-serif;color:#000}h1{font-size:18px;text-align:center;margin:0 0 4px}
.s{font-size:11px;color:#555}.f{text-align:center;margin-bottom:10px}.g{display:flex;gap:10px;margin-bottom:12px}.k{flex:1;border:1px solid #ccc;border-radius:6px;padding:8px;text-align:center}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:4px 6px;text-align:start}th{background:#f1f1f1}</style></head><body>
<h1>${esc(o.title)}</h1><div class="f s">${esc(o.filters)}</div><div class="g">${cards}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  Object.assign(frame.style, { position: "fixed", insetInlineEnd: "0", bottom: "0", width: "0", height: "0", border: "0" })
  document.body.appendChild(frame)
  const d = frame.contentDocument
  if (!d) { frame.remove(); return }
  d.open(); d.write(doc); d.close()
  const go = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); setTimeout(() => frame.remove(), 2000) }
  if (d.readyState === "complete") setTimeout(go, 150)
  else frame.onload = () => setTimeout(go, 150)
}
