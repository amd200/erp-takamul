import { esc, type PrintDoc } from "@/shared/print"
import { tafqeet } from "@/lib/tafqeet"
import type { Branch } from "@/modules/branches/types"
import type { Customer, Measurement } from "@/modules/customers/types"
import { lineAmounts } from "../totals"
import type { PrintInvoice } from "./printInvoice"

export type InvoiceA5Options = {
  branch: Branch | undefined
  customer: Customer | undefined
  isExempt: boolean
  /** Product barcodes by product id, for the "item no." column. */
  barcodes: Map<number, string>
  /** The eye measurements to print above the items, when the sale is an optical one. */
  measurement?: Measurement | null
  /** The customer's balance before this invoice, for the "remaining balance" line. */
  previousBalance?: number
  /** ZATCA QR as an image data URL. */
  qrImage?: string | null
  methodLabel: (method: string) => string
}

/**
 * The invoice laid out like the shop's printed A5 form (148 mm wide). Every position was measured from the paper form
 * by the previous system; the paper is pre-printed with the shop letterhead, so nothing is printed above the QR code:
 * OFFSET_TOP_MM is where the QR code starts.
 */
const PAGE_WIDTH_MM = 148
const OFFSET_TOP_MM = 20

const clean = (v: unknown) => {
  const s = String(v ?? "").trim()
  return ["undefined", "null", "—", "-"].includes(s.toLowerCase()) ? "" : s
}
const n2 = (v?: number | null) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(2) : "0.00")
// The form prints quantity and unit price as plain numbers; only the line value has two decimals.
const plain = (v?: number | null) => String(Number(Number(v ?? 0).toFixed(3)))
// Balances print as a bare 0 when empty, like the paper form.
const balance = (v: number) => (Math.abs(v) < 0.005 ? "0" : n2(v))
// The paper form reads "مائة وخمسة وتسعون ريال", without the formal "ريالاً فقط لا غير" ending.
const words = (v: number) => tafqeet(v, "ar").replace(/ريالاً/g, "ريال").replace(/\s*فقط\s*لا\s*غير\s*$/, "").trim()

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const shortDate = (d: Date) => `${d.getDate()}-${MONTHS[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`
const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }).replace(" ", "")

const mm = (v: number) => `${Math.round(v * 100) / 100}mm`
/** Horizontal sizes are a share of the page width, so the form fills whatever paper is picked in the print dialog (A5 = the measured layout, A4 = the same form stretched across the wider sheet). */
const pct = (valueMm: number) => `${Math.round((valueMm / PAGE_WIDTH_MM) * 100000) / 1000}%`
const rel = (part: number, total: number) => `${Math.round((part / total) * 100000) / 1000}%`
/** Absolutely positioned box; x and width are measured in mm on the A5 form, y and height stay in mm. */
const at = (x: number, y: number, w: number, h: number, extra = "") => `left:${pct(x)};top:${mm(y)};width:${pct(w)};height:${mm(h)};${extra}`

/** Display only: keeps the saved value and its explicit sign. */
function eye(value?: string | number | null, decimals: 2 | "auto" = 2) {
  const text = String(value ?? "").trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return text
  const n = Number(text)
  if (!Number.isFinite(n)) return text
  const sign = text.startsWith("+") ? "+" : text.startsWith("-") ? "-" : ""
  return sign + (decimals === "auto" ? String(Math.abs(n)) : Math.abs(n).toFixed(decimals))
}

function measurementTable(m?: Measurement | null) {
  if (!m) return ""
  const row = (label: string, side: "Right" | "Left") => `<tr class="r"><td class="eye">${label}</td><td>${esc(eye(m[`sph${side}`]))}</td><td>${esc(eye(m[`cyl${side}`]))}</td><td>${esc(eye(m[`axis${side}`], "auto"))}</td>${side === "Right" ? `<td rowspan="2">${esc(eye(m.ipd, "auto"))}</td>` : ""}</tr>`
  return `<table class="rx" dir="ltr"><colgroup><col style="width:${rel(17.4, 82.6)}"><col><col><col><col></colgroup>
<tr class="h1"><td rowspan="2"></td><td colspan="3">DIST</td><td rowspan="2">IPD</td></tr><tr class="h2"><td>SPH</td><td>CYL</td><td>AXIS</td></tr>
${row("RIGHT", "Right")}${row("LEFT", "Left")}</table>`
}

const CSS = `
html,body{margin:0;padding:0}
html,body{width:100%}
body{padding:0;font-family:"Alexandria",Arial,sans-serif;font-size:9pt;font-weight:500;color:#000;direction:rtl;line-height:normal}
*{font-family:"Alexandria",Arial,sans-serif}
.sheet{position:relative;width:100%;padding:${mm(OFFSET_TOP_MM)} 2mm 0}
.zone{position:relative;z-index:1;height:36.8mm}.zone>*{position:absolute}
.box{border:.25mm solid #000;display:flex;align-items:center;justify-content:center;font-size:7pt;line-height:1;white-space:nowrap}
.invoice-summary{left:${pct(4)};top:.2mm;width:${pct(46)};display:grid;grid-template-columns:minmax(0,1fr) max-content;column-gap:2mm;row-gap:1mm;align-items:center;direction:ltr}
.summary-label{height:6.5mm;padding:1mm;font-size:7.5pt;direction:rtl}
.summary-value{text-align:right;font-size:8.5pt;line-height:1;direction:ltr;white-space:nowrap}
.val{display:flex;align-items:center;justify-content:flex-start;font-size:8.5pt;line-height:1;white-space:nowrap;gap:3mm}
.qr img{width:100%;height:100%;display:block}
table{width:auto;border-collapse:collapse}td,th{padding:0;text-align:center;font-weight:500;vertical-align:middle}
.rx{position:relative;z-index:1;width:calc(100% - 8mm);margin:2.3mm auto 0;table-layout:fixed}
.rx td{border:.25mm solid #000;font-size:8.5pt;line-height:1;text-align:center;padding:0;white-space:normal}.rx .h1 td{height:5.2mm}.rx .h2 td{height:5mm}.rx .r td{height:4.75mm}.rx td.eye{font-size:8pt}
.items{position:relative;z-index:1;width:calc(100% - 8mm);margin:1.8mm auto 0;table-layout:fixed}
.items thead td{border:.25mm solid #000;height:6.1mm;font-size:7.5pt;text-align:center;padding:0;white-space:normal}
.items tbody td{border-left:.25mm solid #000;border-right:.25mm solid #000;height:5.2mm;font-size:8.5pt;padding:0;text-align:center;white-space:normal}
.items tbody tr:last-child td{border-bottom:.25mm solid #000}
.items td.name{text-align:right;padding:.7mm 1.5mm;white-space:normal;overflow-wrap:anywhere}
.items td.barcode{padding:.7mm .8mm;font-size:7pt;line-height:1.3}
.items td.barcode>span{display:block;direction:ltr;unicode-bidi:isolate;white-space:normal;overflow-wrap:anywhere;word-break:break-all}
.items td.unit{font-size:7.5pt}
.totals{position:relative;z-index:1;margin-top:1.8mm}.totals>*{position:absolute}
.plainline{display:flex;align-items:center;justify-content:flex-start;font-size:8pt;line-height:1;white-space:nowrap;height:4.4mm}
.payment-line{gap:1mm}.payment-line>span:first-child{flex-shrink:0}
.words{position:relative;z-index:1;margin:1mm ${pct(3.4)} 0 0;font-size:9pt;line-height:1.2}
.note{position:relative;z-index:1;margin:5mm 4mm 0;text-align:center;font-size:8.5pt;line-height:1.2;white-space:pre-wrap;overflow-wrap:anywhere}
.stamp{position:relative;z-index:1;margin:1.5mm ${pct(PAGE_WIDTH_MM - 145.1)} 0 auto;width:${pct(36.1)};height:5.4mm;border:.25mm solid #000;display:flex;direction:ltr}
.stamp div{flex:1;display:flex;align-items:center;justify-content:center;font-size:8pt;line-height:1}
.stamp div:first-child{border-right:.25mm solid #000;flex:0 0 ${rel(18.7, 36.1)}}
.tax{position:relative;z-index:1;margin:3mm ${pct(3.4)} 0 0;font-size:8.5pt;line-height:1.3}
.branch{position:relative;z-index:1;margin:.7mm ${pct(3.4)} 0 0;font-size:8.5pt;line-height:1.3}
`

/** The sales invoice on the shop's printed A5 form (one page). */
export function invoiceA5Doc(inv: PrintInvoice, o: InvoiceA5Options): PrintDoc {
  const b = o.branch
  const c = o.customer
  const lines = inv.lines.map((l) => ({ l, total: (l.amounts ?? lineAmounts(l)).total }))
  const t = inv.totals
  const discount = t.discount
  const hasDiscount = discount > 0
  const paid = inv.paid
  const remaining = (o.previousBalance ?? 0) + t.grandTotal - paid
  const totalQty = lines.reduce((s, { l }) => s + l.quantity, 0)
  const paymentNames = [...new Set(inv.payments.map((p) => o.methodLabel(p.method)))].join(" + ")
  const d = new Date(inv.date)
  const dateText = Number.isNaN(d.getTime()) ? clean(inv.date) : d.toLocaleDateString("en-GB")
  const seller = clean(inv.employeeName) || clean(inv.createdBy)
  const address = [clean(c?.district), clean(c?.street)].filter(Boolean).join(" ")
  const taxNo = clean(b?.taxNumber)
  const now = new Date()

  const rows = lines.map(({ l, total }, i) => {
    const qty = l.quantity
    const unit = qty ? total / qty : l.unitPrice
    return `<tr><td>${i + 1}</td><td class="barcode"><span dir="ltr">${esc(o.barcodes.get(l.productId) ?? "")}</span></td><td class="name">${esc(l.name)}</td><td class="unit">${esc(l.unitName)}</td><td>${plain(qty)}</td><td>${plain(unit)}</td><td>${n2(total)}</td></tr>`
  }).join("")

  const info = [
    { label: "الرقم", value: esc(inv.number) },
    { label: "التاريخ", value: `<span dir="ltr">${esc(dateText)}</span>` },
    { label: "البائع", value: esc(seller) },
    { label: "العميل", value: esc(clean(inv.customerName)) },
    { label: "رقم الملف", value: `<span dir="ltr">${esc(clean(c?.fileNumber))}</span>` },
  ].map((r, i) => {
    const y = 1.6 + i * 4.9
    return `<div class="box" style="${at(131.1, y, 12.9, 4.5)}">${r.label}</div><div class="val" style="${at(76, y, 48, 4.5)}">${r.value}</div>`
  }).join("")

  const notes = clean(inv.notes)
  const footerNote = clean(b?.footerNote)

  const body = `<div class="sheet">
<div class="zone">
  <div class="qr" style="${at(4, 0, 28.9, 28.9, "height:auto;aspect-ratio:1;")}">${o.qrImage && !o.isExempt ? `<img src="${esc(o.qrImage)}" alt="QR">` : ""}</div>
  <div class="box" style="${at(62.8, 1.6, 12.9, 4.5)}">المستودع</div>
  <div class="val" style="${at(40.8, 1, 21.2, 5.6)};white-space:normal;line-height:1.15;font-size:7.5pt;overflow:hidden;justify-content:flex-start;text-align:right">${esc(inv.warehouseName)}</div>
  ${info}
  <div class="box" style="${at(121.4, 32.3, 19.4, 4.5)}">العنوان</div>
  <div class="val" style="${at(66, 32.3, 54, 4.5)}">${esc(address)}</div>
  <div class="box" style="${at(59.2, 32.3, 8.6, 4.5)}">ت</div>
  <div class="val" dir="ltr" style="${at(37.5, 32.3, 19, 4.5)};justify-content:flex-end">${esc(clean(c?.phone))}</div>
</div>
${measurementTable(o.measurement)}
<table class="items">
  <colgroup>${[6.8, 19.2, 44.7, 14.5, 15.4, 16.3, 11.9].map((w) => `<col style="width:${rel(w, 128.8)}">`).join("")}</colgroup>
  <thead><tr><td>م</td><td>رقم الصنف</td><td>اسم الصنف</td><td>الوحدة</td><td>الكمية</td><td>السعر</td><td>القيمة</td></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals" style="height:${mm(hasDiscount ? 29.6 : 22.1)}">
  <div class="invoice-summary">
    ${hasDiscount ? `<div class="summary-value">${n2(discount)}</div><div class="box summary-label">إجمالي الخصم</div>` : ""}
    <div class="summary-value">${n2(t.subTotal)}</div><div class="box summary-label">الإجمالي قبل الضريبة</div>
    <div class="summary-value">${n2(t.tax)}</div><div class="box summary-label">ضريبة القيمة المضافة</div>
    <div class="summary-value">${n2(t.grandTotal)}</div><div class="box summary-label">الإجمالي بعد الضريبة</div>
  </div>
  <div class="box" style="${at(52, 0.7, 22.1, 6.5)};width:max-content;gap:1mm;padding:1mm 1.5mm;font-size:8pt"><span>الكمية</span><span dir="ltr">${n2(totalQty)}</span></div>
  <div class="plainline payment-line" style="${at(76, 0.5, 68.6, 4.4)}"><span>مدفوع من العميل :</span><span dir="ltr">${n2(paid)}</span></div>
  <div class="plainline payment-line" style="${at(76, 6, 68.6, 4.4)}"><span>نوع الدفع :</span><span>${esc(paymentNames || "—")}</span></div>
  <div class="plainline payment-line" style="${at(76, 11.5, 68.6, 4.4)}"><span>الرصيد المتبقي :</span><span dir="ltr">${balance(remaining)}</span></div>
</div>
<div class="words">${esc(words(t.grandTotal))}</div>
<div class="stamp"><div>${clock(now)}</div><div>${shortDate(now)}</div></div>
${!o.isExempt && taxNo ? `<div class="tax">رقم ضريبي: <span dir="ltr">${esc(taxNo)}</span></div>` : ""}
${clean(b?.name) ? `<div class="branch">${esc(clean(b?.name))}</div>` : ""}
${notes ? `<div class="note">${esc(notes)}</div>` : ""}
${footerNote ? `<div class="note">${esc(footerNote)}</div>` : ""}
</div>`

  // `anySheet`: the form follows the paper picked in the print dialog (A5, or A4 stretched), instead of being centred on it.
  return { title: inv.number, paper: "a5", font: "Alexandria", css: CSS, body, anySheet: true }
}
