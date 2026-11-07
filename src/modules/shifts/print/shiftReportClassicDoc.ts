import i18n from "@/shared/i18n"
import { formatClock } from "@/lib/format"
import { esc, type PrintDoc } from "@/shared/print"
import type { ShiftReport } from "../types"

const fmt = (v: number | null | undefined) => (typeof v === "number" && !Number.isNaN(v) ? v.toFixed(2) : "00.00")

type Opts = { withVouchers: boolean; byEmployee: boolean; exempt: boolean }

const CSS = `body{width:auto;padding:4mm 3mm;font-size:12px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding:5px 16px;border:1px solid #d4d4d4;border-radius:12px;background:#f5f5f5}
.meta-label,.card-row span{color:#525252;font-size:10px;font-weight:700}.meta-value{display:block;margin-top:4px;font-size:14px;font-weight:700}.meta-end{text-align:end}
.times{display:flex;align-items:stretch;padding:12px;margin-bottom:20px;border:1px solid #d4d4d4;border-radius:8px}.time{flex:1;text-align:center}.time+.time{border-inline-start:1px solid #d4d4d4}
.time-value{display:block;margin-top:4px;font-size:12px;font-weight:700}
.section{margin-bottom:16px}.section-title{margin:0 0 10px;font-size:14px;font-weight:700}
.table-wrap{overflow:hidden;border:1px solid #d4d4d4;border-radius:8px;break-inside:avoid}
table{table-layout:fixed}th{padding:8px 4px;background:#f5f5f5;border-bottom:1px solid #d4d4d4;font-size:10px;text-align:center;white-space:nowrap}
td{padding:9px 4px;border-bottom:1px solid #d4d4d4;font-size:11px;font-weight:500;text-align:center}tr:last-child td{border-bottom:0}
.table-wrap th,.table-wrap td{padding-inline:4px;text-align:center;white-space:nowrap;direction:ltr}.table-wrap th:first-child,.table-wrap td:first-child{padding-inline-start:8px;text-align:start;white-space:normal;word-break:break-word;direction:rtl}.table-wrap td:nth-child(4){font-weight:700}
.totals{padding:4px 14px;border:1px solid #d4d4d4;border-radius:12px;break-inside:avoid}
.total-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:12px;font-weight:600;white-space:nowrap}
.total-row.muted{border-bottom:1px dashed #a3a3a3;color:#525252;font-size:12px}.grand{padding-top:6px;font-size:14px;font-weight:700}.grand strong{font-size:18px;font-weight:900}
.cards{display:grid;grid-template-columns:1fr;gap:12px}.cards.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.card{padding:8px 12px;border:1px solid #d4d4d4;border-radius:12px;break-inside:avoid}
.card-name{padding-bottom:9px;margin-bottom:9px;border-bottom:1px dashed #a3a3a3;font-size:12px;font-weight:700}
.card-row{display:flex;align-items:center;justify-content:space-between;white-space:nowrap}.card-row+.card-row{margin-top:8px}.card-row strong{font-size:13px;font-weight:900}
.card-center{text-align:center}.card-center strong{display:block;margin-top:4px;font-size:13px;font-weight:900}
.emp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:10px;margin-bottom:10px;border-bottom:1px dashed #a3a3a3;font-size:11px;font-weight:700}.emp-head strong{font-size:14px;font-weight:900}`

const row = (label: string, value: string | number, strong = "") => `<div class="card-row"><span>${esc(label)}</span><strong class="${strong}">${esc(value)}</strong></div>`
const section = (title: string, content: string) => `<section class="section"><h2 class="section-title">${esc(title)}</h2>${content}</section>`

/** The shift statement as the old system prints it: a header, the start/end box, the sold items, the totals, then a card per treasury / employee. */
export function shiftReportClassicDoc(r: ShiftReport, o: Opts): PrintDoc {
  const t = (k: string) => i18n.t(`shiftOld.${k}`)
  const clock = (v: string | null | undefined) => (v ? formatClock(v, i18n.language) : "---")
  const treasuries = r.treasuries ?? []
  const returns = treasuries.filter((x) => x.totalReturns > 0)

  const items = (r.soldItems ?? []).map((x) => `<tr><td>${esc(x.productName)}</td><td>${fmt(x.unitPrice)}</td><td>${esc(x.quantity)}</td><td>${fmt(x.lineTotal)}</td></tr>`).join("")

  const body = `<header class="header">
<div><span class="meta-label">${t("userName")}</span><span class="meta-value">${esc(r.employeeName)}</span></div>
<div class="meta-end"><span class="meta-label">${t("shiftNumber")}</span><span class="meta-value">#${esc(r.shiftId)}</span></div></header>
<div class="times">
<div class="time"><span class="meta-label">${t("start")}</span><span class="time-value">${esc(r.shiftDate?.slice(0, 10) || "—")}</span><span class="time-value">${esc(clock(r.startTime))}</span></div>
<div class="time"><span class="meta-label">${t("end")}</span><span class="time-value">${esc(r.endDate?.slice(0, 10) || "---")}</span><span class="time-value">${esc(clock(r.endTime))}</span></div></div>
${section(`${t("statement")} (${t("sales")})`, `<div class="table-wrap"><table><colgroup><col style="width:46%"><col style="width:18%"><col style="width:12%"><col style="width:24%"></colgroup><thead><tr><th>${t("product")}</th><th>${t("price")}</th><th>${t("quantity")}</th><th>${t("total")}</th></tr></thead><tbody>${items}</tbody></table></div>`)}
<section class="section"><div class="totals">
${o.exempt ? "" : `<div class="total-row muted"><span>${t("beforeTax")}</span><strong>${fmt(r.salesSubTotal)}</strong></div><div class="total-row muted"><span>${t("totalTax")}</span><strong>${fmt(r.salesTaxAmount)}</strong></div>`}
<div class="total-row grand"><span>${t("grandTotal")}</span><strong>${fmt(r.salesGrandTotal)}</strong></div></div></section>
${(r.deferredSalesInvoicesCount ?? 0) > 0 ? section(t("deferred"), `<div class="card">${row(t("invoicesCount"), r.deferredSalesInvoicesCount ?? "—")}${row(t("total"), fmt(r.deferredSalesInvoicesTotal))}</div>`) : ""}
${treasuries.length ? section(`${t("treasuriesDaily")} (${t("sales")})`, `<div class="cards">${treasuries.map((x) => `<div class="card"><div class="card-name">${esc(x.treasuryName)}</div>${row(t("invoicesCount"), x.invoicesCount)}${row(t("totalSales"), fmt(x.totalSales))}</div>`).join("")}</div>`) : ""}
${returns.length ? section(t("returns"), `<div class="cards">${returns.map((x) => `<div class="card"><div class="card-name">${esc(x.treasuryName)}</div>${row(t("totalReturns"), fmt(x.totalReturns))}</div>`).join("")}</div>`) : ""}
${returns.length || (o.withVouchers && treasuries.some((x) => (x.paymentCount ?? 0) > 0)) ? section(`${t("netSection")} (${t("sales")} - ${t("returns")})`, `<div class="cards">${treasuries.map((x) => `<div class="card"><div class="card-name">${esc(x.treasuryName)}</div>${row(t("netSales"), fmt(x.netTotal))}${o.withVouchers ? row(t("voucherCount"), x.paymentCount ?? "—") + row(t("voucherTotal"), fmt(x.paymentTotal)) + row(t("treasuryNet"), fmt(x.paymentTotal == null ? null : x.netTotal + x.paymentTotal)) : ""}</div>`).join("")}</div>`) : ""}
${o.byEmployee && (r.employeeSalesSummary?.length ?? 0) > 0 ? section(t("employeeDaily"), `<div class="cards">${(r.employeeSalesSummary ?? []).map((e) => `<div class="card"><div class="emp-head"><span>${esc(e.employeeName || "—")} (${esc(e.salesInvoicesCount)} ${t("orders")})</span><strong>${t("net")} ${fmt(e.netSales)}</strong></div>${row(`${t("totalReturns")} (${e.returnInvoicesCount ?? 0} ${t("returnsUnit")})`, fmt(e.totalReturns))}</div>`).join("")}</div>`) : ""}
${(r.totalExpenses ?? 0) > 0 || (r.totalPurchases ?? 0) > 0 ? section(t("purchasesExpenses"), `<div class="cards two"><div class="card card-center"><span class="meta-label">${t("totalPurchases")}</span><strong>${fmt(r.totalPurchases)}</strong></div><div class="card card-center"><span class="meta-label">${t("totalExpenses")}</span><strong>${fmt(r.totalExpenses)}</strong></div></div>`) : ""}`

  return { title: i18n.t("shifts.reportTitle", { id: r.shiftId }), paper: "roll80", css: CSS, body, anySheet: true }
}
