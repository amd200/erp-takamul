import { currencyMark, esc, type PrintDoc } from "@/shared/print"
import type { Branch } from "@/modules/branches/types"
import type { Customer } from "@/modules/customers/types"
import { lineAmounts } from "../totals"
import type { PrintInvoice } from "./printInvoice"

export type InvoiceRollOptions = {
  documentTitle?: { ar: string; en: string }
  documentNumberLabel?: { ar: string; en: string }
  branch: Branch | undefined
  customer: Customer | undefined
  isExempt: boolean
  showPaymentMethods: boolean
  showPaidAndRemaining: boolean
  /** The full branch names are printed unless the branch asked for the short ones. */
  showBranchName: boolean
  /** Items as a three-column grid (setting "invoiceDesign3") instead of the stacked layout. */
  grid: boolean
  /** Shows the unit under the item name. */
  showUnits: boolean
  methodLabel: (method: string) => string
  /** Default currency symbol; SAR when not given. */
  currency?: string
}

const clean = (v: unknown) => {
  const s = String(v ?? "").trim()
  return ["", "undefined", "null", "—", "-"].includes(s.toLowerCase()) ? "" : s
}
const money = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(2)
const DEFAULT_CUSTOMERS = new Set(["العميل الافتراضي", "الافتراضي", "عميل نقدي", "نقدي"])

// The 80mm receipt as the Takamul web app prints it: centered header, dashed-free ruled rows, totals list.
const CSS = `
html{width:100%}body{width:100%;max-width:80mm;margin:0 auto;padding:0;overflow-x:hidden;font:inherit;line-height:1.35;text-rendering:optimizeLegibility}
*{font-family:'Alexandria',Arial,sans-serif}
.page{width:100%;padding:0 3mm;text-align:center;overflow-wrap:anywhere}
.page *{min-width:0}
.info-row .title,.total-row .label{flex:0 0 auto;max-width:55%}.info-row .value{flex:1 1 auto;overflow-wrap:anywhere}
.logo-box{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1px 0 4px}
.logo-box img{max-height:65px;max-width:100%;height:auto;object-fit:contain;margin-bottom:4px}
.branch-name{font-size:10pt;font-weight:700;margin-top:4px}
.row-value{font-size:9pt;font-weight:700;margin-top:2px}
.title-line{text-align:center;font-size:8pt;font-weight:700;padding:4px 0}
.info-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:3px 4px;font-size:8pt;font-weight:700;line-height:1.25}
.info-row .title{text-align:right}.info-row .value{text-align:left}
.simple-line{border-bottom:1px solid #000;margin:6px 0;width:100%}
.items-section{border-top:1px solid #000;margin-top:6px}
.item-row{border-bottom:1px solid #000;padding:8px 0;position:relative}
.item-name{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;font-size:8pt;font-weight:700;margin-bottom:4px}
.item-name-product{flex:1 1 auto;min-width:0;text-align:right}
.item-additions{flex:0 1 45%;min-width:0;text-align:left;direction:rtl;font-size:7.5pt;font-weight:700}
.item-meta{display:flex;justify-content:space-between;align-items:center;padding:0 12px;font-size:9pt;font-weight:700;line-height:1.4}
.meta-block{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:25%}
.meta-label{font-size:7.5pt;font-weight:400;white-space:nowrap}
.meta-val{font-size:9pt;font-weight:700;white-space:nowrap}
.sar-text,.unit{font-size:6.5pt;font-weight:400}
.item-row-grid{display:grid;grid-template-columns:45fr 55fr;grid-template-areas:"product labels" "product values";column-gap:8px;row-gap:3px;align-items:start;min-height:48px;padding-top:7px}
.grid-product{grid-area:product;display:flex;flex-direction:column;min-width:0;text-align:right;font-size:8pt;font-weight:700}
.grid-extra{margin-top:4px;text-align:right;direction:rtl;font-size:7.5pt;font-weight:700}
.grid-labels,.grid-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:6px;text-align:center}
.grid-labels{grid-area:labels;font-size:7.5pt;font-weight:400}
.grid-values{grid-area:values;font-size:9pt;font-weight:700}
.totals-section{margin-top:2px}
.total-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:3px 4px;font-weight:700;font-size:8pt;line-height:1.25}
.total-row:last-child{border-bottom:1px solid #000}
.total-row .label{text-align:right}.total-row .value{font-size:10pt;white-space:nowrap}
.notes-box{border-top:1px solid #000;padding:8px 4px;text-align:right;font-size:7pt;font-weight:700}
.notes-title{display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding-bottom:4px;margin-bottom:6px}
.notes-content{font-weight:400;white-space:pre-line;line-height:1.3}
.footer-phone{font-size:8pt;font-weight:700;padding:8px 0;display:flex;justify-content:space-between}
.footer-addr{font-size:7pt;font-weight:700;padding:4px 0 5px;direction:rtl;unicode-bidi:isolate}
@media print{@page{size:80mm auto;margin:0}}
`

/** The sales invoice on an 80mm roll, laid out like the one the Takamul web app prints. */
export function invoiceRollDoc(inv: PrintInvoice, o: InvoiceRollOptions): PrintDoc {
  const b = o.branch
  const c = o.customer
  const lines = inv.lines.map((l) => {
    const a = l.amounts ?? lineAmounts(l)
    return { l, total: a.total, unit: l.quantity ? a.total / l.quantity : a.total }
  })

  const names = o.showBranchName ? { ar: clean(b?.name), en: clean(b?.nameEn) } : { ar: clean(b?.shortName), en: clean(b?.shortNameEn) }
  const taxNo = clean(c?.taxNumber)
  const customerName = clean(inv.customerName)
  const showCustomer = customerName !== "" && !DEFAULT_CUSTOMERS.has(customerName)
  const address = [c?.stateName, c?.cityName, c?.district, c?.street].map(clean).filter(Boolean).join(" - ")
  const branchAddress = [b?.cityName, b?.district, b?.street].map(clean).filter(Boolean).join(" / ")
  const d = new Date(inv.date)
  const when = Number.isNaN(d.getTime()) ? clean(inv.date) : `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`

  const info = (title: string, value: string) => (value ? `<div class="info-row"><div class="title">${esc(title)}</div><div class="value">${esc(value)}</div></div>` : "")
  const total = (label: string, value: number) => `<div class="total-row"><div class="label">${esc(label)}</div><div class="value">${money(value)} <span class="unit">${currencyMark(o.currency, "1.5em")}</span></div></div>`

  const itemRows = lines.map(({ l, total: lt, unit }) => o.grid
    ? `<div class="item-row item-row-grid">
<span class="grid-product"><span>${esc(l.name)}</span>${o.showUnits && l.unitName ? `<span class="grid-extra">الوحدة: ${esc(l.unitName)}</span>` : ""}</span>
<span class="grid-labels"><span>الكمية</span><span>السعر</span><span>الإجمالي</span></span>
<div class="grid-values"><span>${l.quantity}</span><span>${money(unit)}</span><span>${money(lt)}</span></div></div>`
    : `<div class="item-row">
<div class="item-name"><span class="item-name-product">${esc(l.name)}</span>${o.showUnits && l.unitName ? `<span class="item-additions">الوحدة: ${esc(l.unitName)}</span>` : ""}</div>
<div class="item-meta">
<span class="meta-block"><span class="meta-label">كمية</span><span class="meta-val">${l.quantity}</span></span>
<span class="meta-block"><span class="meta-label">سعر</span><span class="meta-val">${money(unit)}</span></span>
<span class="meta-block"><span class="meta-label">اجمالي</span><span class="meta-val">${money(lt)} <span class="sar-text">${currencyMark(o.currency, "1.5em")}</span></span></span>
</div></div>`).join("")

  const t = inv.totals
  const notes = clean(inv.notes)
  const footerNote = clean(b?.footerNote)
  const remaining = Math.max(0, t.grandTotal - inv.paid)

  const body = `<div class="page">
<div class="logo-box">${b?.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="" crossorigin="anonymous">` : ""}
${names.ar ? `<div class="branch-name" dir="rtl">${esc(names.ar)}</div>` : ""}${names.en ? `<div class="branch-name" dir="ltr">${esc(names.en)}</div>` : ""}</div>

${o.documentTitle ? `<div class="title-line">${esc(o.documentTitle.ar)}</div>` : o.isExempt ? "" : `<div class="title-line">${taxNo ? "فاتورة ضريبية" : "فاتورة ضريبية مبسطة"}</div>`}
${o.isExempt ? "" : info("الرقم الضريبي", clean(b?.taxNumber))}
${info(o.documentNumberLabel?.ar ?? "رقم الفاتورة", clean(inv.number))}
${info("الوقت التاريخ", when)}
<div class="simple-line"></div>
${showCustomer ? info("اسم العميل", customerName) : ""}
${info("موظف الخدمة", clean(inv.employeeName))}
${info("جوال العميل", clean(c?.phone))}
${o.isExempt ? "" : info("الرقم الضريبي للعميل", taxNo)}
${info("عنوان العميل", address)}
${info("السجل التجاري", clean(c?.commercialRegister))}
${info("رقم المبنى", clean(c?.buildingNumber))}
${info("الرقم الإضافي", clean(c?.additionalNumber))}
${info("الرمز البريدي", clean(c?.postalCode))}

<div class="items-section">${itemRows}</div>

<div class="totals-section">
<div class="total-row"><div class="label">عدد المنتجات</div><div class="value">${lines.length}</div></div>
${t.discount > 0 ? total("اجمالي الخصم", t.discount) : ""}
${o.isExempt ? "" : total("اجمالي قبل الضريبة", t.grandTotal - t.tax) + total("اجمالي الضريبة", t.tax)}
${total("الاجمالي النهائي", t.grandTotal)}
${o.showPaymentMethods ? inv.payments.map((p) => total(`نوع الدفع (${o.methodLabel(p.method)})`, p.amount)).join("") : ""}
${o.showPaidAndRemaining ? total("المدفوع", inv.paid) + total("المتبقي", remaining) : ""}
</div>

${notes ? `<div class="notes-box"><div class="notes-title"><span>الملاحظات</span><span>Notes</span></div><div class="notes-content">${esc(notes)}</div></div>` : ""}
${footerNote ? `<div class="notes-box"><div class="notes-content" style="text-align:center">${esc(footerNote)}</div></div>` : ""}
${clean(b?.phone) ? `<div class="footer-phone">&nbsp; رقم الجوال <span class="row-value">${esc(clean(b?.phone))}</span></div>` : ""}
${branchAddress ? `<div class="footer-addr">${esc(branchAddress)}</div>` : ""}
</div>`

  return { title: inv.number, paper: "roll80", font: "Alexandria", css: CSS, body }
}
