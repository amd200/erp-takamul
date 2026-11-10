import i18n from "@/shared/i18n"
import { esc, type PrintDoc } from "@/shared/print"
import type { AdjustmentDto } from "../types"

const css = `.head{text-align:center;margin:0 0 14px}.head h1{font-size:18px}.meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:12px}
table.adj{margin-top:6px}table.adj th,table.adj td{border:1px solid #cbd5e1;padding:6px 8px;text-align:center;white-space:normal}table.adj th{background:#f1f5f9;font-size:11px}
table.adj td.name{text-align:start}.code{color:#666;font-size:10px}.total{display:inline-flex;border:1px solid #000;margin-top:14px;font-weight:700}.total div{padding:6px 14px}.total div:first-child{border-inline-end:1px solid #000}.notes{margin-top:12px;white-space:pre-wrap}`

/** The quantity adjustment as a printable A4 page: its lines with the quantity before, the operation, its quantity and the quantity after. */
export function adjustmentDoc(a: AdjustmentDto, date: string): PrintDoc {
  const t = (k: string) => i18n.t(`adjForm.${k}`)
  const items = a.items ?? []
  const rows = items.map((l, i) => `<tr><td>${i + 1}</td><td class="name">${esc(l.productName)}${l.barcode ? ` <span class="code" dir="ltr">(${esc(l.barcode)})</span>` : ""}</td><td>${esc(l.quantityBefore ?? 0)}</td><td>${l.operationType === "Remove" ? t("opRemove") : t("opAdd")}</td><td><b>${esc(l.quantityChanged ?? 0)}</b></td><td>${esc(l.quantityAfter ?? 0)}</td></tr>`).join("")
  const total = items.reduce((s, l) => s + (l.quantityChanged ?? 0), 0)
  const body = `<div class="head"><h1>${t("title")}</h1></div>
<div class="meta"><span>ID: ${a.id}</span><span>${esc(date)}</span><span>${t("enteredBy")}: ${esc(a.performedBy)}</span></div>
<table class="adj"><thead><tr><th>${t("serial")}</th><th>${t("nameCode")}</th><th>${t("before")}</th><th>${t("operationType")}</th><th>${t("operationQty")}</th><th>${t("after")}</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total"><div>${esc(total)}</div><div>${t("total")}</div></div>
${a.notes ? `<div class="notes"><b>${t("notes")}:</b> ${esc(a.notes)}</div>` : ""}`
  return { title: `${t("title")} ${a.id}`, paper: "a4", body, css }
}
