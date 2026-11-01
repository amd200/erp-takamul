import i18n from "@/shared/i18n"
import { formatMoney, formatNumber, formatQty, formatDateTime, formatClock } from "@/lib/format"
import { esc, type PrintDoc } from "@/shared/print"
import type { ShiftReport } from "../types"

const money = (v: number | null | undefined) => v == null ? "—" : formatMoney(v)
const number = (v: number | null | undefined) => v == null ? "—" : formatNumber(v)

const hm = (v: string | null | undefined) => formatClock(v, i18n.language) || "—"

const row = (label: string, value: string, cls = "") => `<div class="row ${cls}"><span>${esc(label)}</span><span class="num">${value}</span></div>`

/** The shift report on a receipt roll: same figures as the report dialog, for printing or PDF. */
export function shiftReportDoc(r: ShiftReport, opts: { withVouchers: boolean; byEmployee: boolean }): PrintDoc {
  const t = (k: string, o?: Record<string, unknown>) => i18n.t(k, o)

  const summary = [
    row(t("shifts.openingBalance"), money(r.openingBalance)),
    row(t("shifts.invoices"), number(r.salesInvoicesCount)),
    row(t("shifts.sales"), money(r.salesGrandTotal)),
    row(t("shifts.tax"), money(r.salesTaxAmount)),
    row(t("shifts.returns"), money(r.returnInvoicesTotal)),
    row(t("shifts.expenses"), money(r.totalExpenses)),
    row(t("shifts.revenues"), money(r.totalRevenues)),
    (r.deferredSalesInvoicesCount ?? 0) > 0 ? row(t("shifts.deferred", { count: r.deferredSalesInvoicesCount }), money(r.deferredSalesInvoicesTotal)) : "",
    (r.totalPurchases ?? 0) > 0 ? row(t("shifts.purchases"), money(r.totalPurchases)) : "",
    `<hr>${row(t("shifts.net"), money(r.netTotal), "b big")}`,
  ].join("")

  // One block per treasury reads better on a narrow roll than a wide table.
  const treasuries = (r.treasuries ?? []).map((x) => `<div class="card"><div class="b">${esc(x.treasuryName)}</div>
${row(t("shifts.sales"), money(x.totalSales))}${row(t("shifts.returns"), money(x.totalReturns))}${row(t("shifts.expenses"), money(x.totalExpenses))}${row(t("shifts.revenues"), money(x.totalRevenues))}
${opts.withVouchers ? row(t("shifts.unlinkedVoucherCount"), number(x.paymentCount)) + row(t("shifts.voucherTotal"), money(x.paymentTotal)) : ""}
${row(t("shifts.net"), money(x.netTotal), "b")}</div>`).join("")

  const employees = (opts.byEmployee ? r.employeeSalesSummary ?? [] : []).map((x) => `<tr><td>${esc(x.employeeName || "—")}</td><td>${number(x.salesInvoicesCount)}</td><td>${money(x.netSales)}</td></tr>`).join("")
  const items = (r.soldItems ?? []).map((x) => `<tr><td>${esc(x.productName)}</td><td>${formatQty(x.quantity)}</td><td>${money(x.lineTotal)}</td></tr>`).join("")

  return {
    title: t("shifts.reportTitle", { id: r.shiftId }),
    paper: "roll80",
    css: ".card{border:1px solid #000;border-radius:6px;padding:4px 6px;margin-bottom:6px;break-inside:avoid}",
    body: `<h1>${esc(t("shifts.reportTitle", { id: r.shiftId }))}</h1>
<div class="c">${esc(r.employeeName)}</div>
<div class="c muted"><bdi>${esc(r.shiftDate?.slice(0, 10) || "—")}</bdi> · <bdi dir="ltr">${hm(r.startTime)} → ${r.endTime ? hm(r.endTime) : "—"}</bdi></div><hr>
${summary}
${treasuries ? `<h2>${esc(t("shifts.byTreasury"))}</h2>${treasuries}` : ""}
${employees ? `<h2>${esc(t("shifts.byEmployee"))}</h2><table><thead><tr><th>${esc(t("shifts.employee"))}</th><th>${esc(t("shifts.invoices"))}</th><th>${esc(t("shifts.net"))}</th></tr></thead><tbody>${employees}</tbody></table>` : ""}
${items ? `<h2>${esc(t("shifts.soldItems"))}</h2><table><thead><tr><th>${esc(t("products.item"))}</th><th>${esc(t("shifts.qty"))}</th><th>${esc(t("shifts.lineTotal"))}</th></tr></thead><tbody>${items}</tbody></table>` : ""}
<hr><div class="c muted">${esc(formatDateTime(new Date(), i18n.language))}</div>`,
  }
}
