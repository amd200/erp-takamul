import { esc, type PrintDoc } from "@/shared/print"
import type { PrepOrder } from "./types"

export type BonStatus = "pending" | "ready" | "overdue"

export type BonOptions = {
  status: BonStatus
  /** "Arabic", "English" or "ArabicAndEnglish" (setting "preparationTicketInvoiceType"). */
  language?: string | null
  showInvoiceNumber: boolean
  showStartNumber: boolean
  showOrderType: boolean
  showCustomer: boolean
  /** The ticket on the kitchen screen scrolls and is coloured by status; the printed one is plain black on white. */
  mode: "preview" | "print"
}

const ORDER_TYPES = [
  { ar: "سفري", en: "Takeaway", values: ["سفري", "takeaway"] },
  { ar: "محلي", en: "Dine-in", values: ["محلي", "indine", "dinein"] },
  { ar: "توصيل", en: "Delivery", values: ["توصيل", "delivery"] },
]

// The preparation ticket as the previous system draws it: status header, ruled info grid, name / quantity table.
const CSS = `
html,body{height:100%;font-size:7pt}body{padding:0;width:auto}
*{margin:0;padding:0;font-family:'Alexandria',Arial,sans-serif}
.page{width:100%;display:flex;flex-direction:column;padding:3mm 5mm}
.header{text-align:center;font-size:12pt;font-weight:900;padding:6px 4px 8px;border:2px solid #000;background:#facc15;color:#fff}
.header.ready{background:#15803d}.header.overdue{background:#ef4444}
.info-grid{width:100%;border-collapse:collapse;border:2px solid #000;border-top:none}
.info-grid td{padding:4px 6px;font-size:7pt;line-height:1.5;vertical-align:middle;border:1px solid #000;font-weight:700;word-break:break-word}
.info-grid td.lbl{background:#f0f0f0;text-align:start;width:35%}
.info-grid td.val{text-align:center;font-weight:900;font-size:8pt;white-space:normal}
.info-grid td.sep{border-inline-start:2px solid #000}
.info-grid td.badge-cell{text-align:center;padding:7px 4px 5px}
.badge{display:inline-block;min-width:110px;border:2px solid #000;padding:2px 10px;font-size:11pt;font-weight:900;line-height:1.1;text-align:center}
.items{width:100%;border-collapse:collapse;border:2px solid #000;border-top:none;table-layout:fixed}
.items th{background:#d9d9d9;font-weight:700;font-size:8pt;text-align:center;padding:3px 2px;border:1px solid #000;line-height:1.3}
.items td{border:1px solid #000;padding:4px 2px;text-align:center;font-weight:900;font-size:7pt;vertical-align:middle;line-height:1.4;word-break:break-word}
.items th:nth-child(1),.items td:nth-child(1){width:78%}.items th:nth-child(2),.items td:nth-child(2){width:22%}
.items td.name{text-align:start;padding:7px 6px;font-weight:700}
.items td.qty{font-size:12pt}
.extra{display:block;font-size:6.5pt;font-weight:700;color:#333}
.preview .items th{position:sticky;top:0;z-index:1}
.preview .scroll{min-height:0;flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
.preview .page{height:100%;min-height:0}
.print .header,.print .header.ready,.print .header.overdue{background:#fff;color:#000}
.print .info-grid td.lbl,.print .items th{background:#fff}
`

const text = (v: unknown) => (v == null ? "" : String(v).trim())

/** The kitchen ticket for one order, for the screen preview (`mode: "preview"`) or the printer (`"print"`). */
export function bonDoc(o: PrepOrder, opt: BonOptions): PrintDoc {
  const { language: lang } = opt
  const en = lang === "English"
  const dir = en ? "ltr" : "rtl"
  const label = (ar: string, e: string) => (lang === "ArabicAndEnglish" ? `${esc(ar)}<br><span dir="ltr">${esc(e)}</span>` : esc(en ? e : ar))
  const title = lang === "ArabicAndEnglish" ? `بون تحضير<br><span dir="ltr">Preparation Ticket</span>` : en ? "Preparation Ticket" : "بون تحضير"

  const orderType = String(o.orderTypeName || o.orderType || "").trim()
  const key = orderType.toLowerCase().replace(/[\s_-]/g, "")
  const type = ORDER_TYPES.find((x) => x.values.includes(key))
  const typeText = type ? label(type.ar, type.en) : esc(orderType)

  const row = (ar: string, e: string, value: string) => (value ? `<tr><td class="lbl">${label(ar, e)}</td><td class="val sep">${esc(value)}</td></tr>` : "")
  const info = [
    row("رقم الخدمة", "Service Number", text(o.orderDeviceNumber)),
    row("رقم الطاولة", "Table Number", text(o.tableNumber)),
    opt.showCustomer ? row("اسم العميل", "Customer Name", text(o.customerName)) : "",
    opt.showInvoiceNumber ? row("رقم الفاتورة", "Invoice Number", o.orderNumber ?? String(o.id)) : "",
  ].join("")

  // The order number and type sit inside the same table as the info rows, so the whole block hangs directly under the title box.
  const badge = (html: string) => `<tr><td class="badge-cell" colspan="2"><span class="badge">${html}</span></td></tr>`
  const head = [
    opt.showStartNumber && text(o.salesOrderStartNumber) ? badge(`${label("الطلب", "Order")} #${esc(text(o.salesOrderStartNumber))}`) : "",
    opt.showOrderType && orderType ? badge(typeText) : "",
  ].join("")

  const rows = (o.items ?? []).map((i) => `<tr><td class="name">${esc(en && i.productNameEn ? i.productNameEn : i.productName ?? "")}${(i.additions ?? []).map((a) => ({ name: a.additionNameAr || a.additionNameEn || "", nameEn: a.additionNameEn || a.additionNameAr || "" })).filter((x) => x.name).map((x) => `<span class="extra">+ ${esc(en ? x.nameEn : x.name)}</span>`).join("")}${i.notes ? `<span class="extra">${esc(i.notes)}</span>` : ""}</td><td class="qty">${i.quantity}</td></tr>`).join("")

  const body = `<div class="${opt.mode}"><div class="page">
<div class="header ${opt.status === "pending" ? "" : opt.status}" dir="${dir}">${title}</div>
${head || info ? `<table class="info-grid" dir="${dir}">${head}${info}</table>` : ""}
<div class="scroll"><table class="items" dir="${dir}"><thead><tr><th>${label("الصنف", "Item")}</th><th>${label("الكمية", "Qty")}</th></tr></thead><tbody>${rows}</tbody></table></div>
</div></div>`

  return { title: o.orderNumber ?? String(o.id), paper: "roll80", font: "Alexandria", css: CSS, body }
}
