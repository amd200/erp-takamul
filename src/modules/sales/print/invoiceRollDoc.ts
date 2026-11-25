import { currencyMark, esc, type PrintDoc } from "@/shared/print"
import type { Branch } from "@/modules/branches/types"
import type { Customer } from "@/modules/customers/types"
import { lineAmounts } from "../totals"
import type { Settings } from "@/modules/settings/types"
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
  /** Design 1 stacks the items, design 2 lays them out as a three-column grid, design 3 is the simplified single-column receipt. */
  rollDesign: RollDesign
  /** Shows the unit under the item name. */
  showUnits: boolean
  methodLabel: (method: string) => string
  /** Default currency symbol; SAR when not given. */
  currency?: string
  /** ZATCA QR as an image data URL; printed at the bottom unless tax exempt. */
  qrImage?: string | null
  /** Prints the service employee (setting "showEmployeeService"). */
  showEmployeeService: boolean
  /** Prints the order number badge (setting "salesOrderStartNumber") and, for takeaway, the order type (setting "selectOrderTypeDuringSave"). */
  showOrderNumber: boolean
  showOrderType: boolean
}

export type RollDesign = "Design1" | "Design2" | "Design3"

/** The saved roll design, or the older "invoiceDesign3" switch (on = design 2) when the server sent none. */
export const rollDesignOf = (tab: { rollInvoiceDesign?: string | null; invoiceDesign3?: boolean } | undefined): RollDesign =>
  tab?.rollInvoiceDesign === "Design2" || tab?.rollInvoiceDesign === "Design3" || tab?.rollInvoiceDesign === "Design1" ? tab.rollInvoiceDesign : tab?.invoiceDesign3 ? "Design2" : "Design1"

/**
 * The 80mm roll's options from the settings, the same for every place that draws an invoice on the roll (the cashier's
 * print and PDF, the customer's /qr page), so they all look exactly alike.
 */
/** The roll settings every roll document takes from the settings (the design, units, service employee, order number and type). */
export type RollFlags = Pick<InvoiceRollOptions, "rollDesign" | "showUnits" | "showEmployeeService" | "showOrderNumber" | "showOrderType">
export const rollFlagsOf = (settings: Settings): RollFlags => ({
  rollDesign: rollDesignOf(settings.printRollTab),
  showUnits: settings.itemsTab?.enablePieceAndCartonSystem === true,
  showEmployeeService: settings.salonsTab?.showEmployeeService === true,
  showOrderNumber: settings.generalTab?.salesOrderStartNumber === true,
  showOrderType: settings.salesScreenTab?.selectOrderTypeDuringSave === true,
})

export const rollOptionsOf = (settings: Settings, o: { branch: Branch | undefined; customer: Customer | undefined; currency?: string; methodLabel: (m: string) => string; qrImage?: string | null }): InvoiceRollOptions => ({
  ...o,
  ...rollFlagsOf(settings),
  isExempt: settings.taxSetting?.taxSetting === "Exempt",
  showPaymentMethods: settings.paymentTab?.showPaymentMethods !== false,
  showPaidAndRemaining: settings.paymentTab?.showPaidAndRemainingAmount !== false,
  showBranchName: settings.printRollTab?.showBranchNameInPrint === true,
})

const clean = (v: unknown) => {
  const s = String(v ?? "").trim()
  return ["", "undefined", "null", "—", "-"].includes(s.toLowerCase()) ? "" : s
}
const money = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(2)

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
.item-note{text-align:right;font-size:7.5pt;font-weight:700;direction:rtl}
.order-badges{justify-content:center;gap:6px;padding:6px 4px}
.order-badge{display:inline-block;min-width:110px;border:2px solid #000;padding:2px 10px;font-size:10pt;font-weight:900;line-height:1.1;text-align:center}
.qr-box{width:100%;display:flex;justify-content:center;align-items:center;padding:7px 0 12px}
.qr-box img{width:170px;height:170px;display:inline-block;margin:0 auto}
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
  const showCustomer = customerName !== ""
  const address = [c?.stateName, c?.cityName, c?.district, c?.street].map(clean).filter(Boolean).join(" - ")
  const branchAddress = [b?.cityName, b?.district, b?.street].map(clean).filter(Boolean).join(" / ")
  const d = new Date(inv.date)
  const when = Number.isNaN(d.getTime()) ? clean(inv.date) : `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`

  const info = (title: string, value: string) => (value ? `<div class="info-row"><div class="title">${esc(title)}</div><div class="value">${esc(value)}</div></div>` : "")
  const total = (label: string, value: number) => `<div class="total-row"><div class="label">${esc(label)}</div><div class="value">${money(value)} <span class="unit">${currencyMark(o.currency, "1.5em")}</span></div></div>`

  if (o.rollDesign === "Design3") return simplifiedRollDoc(inv, o)

  // Under the item name: its additions, its unit (when units are on) and its note.
  const extras = (l: (typeof lines)[number]["l"]) => [
    ...(l.additions?.length ? [`الإضافات : ${l.additions.join(" - ")}`] : []),
    ...(o.showUnits && l.unitName ? [`الوحدة: ${l.unitName}`] : []),
  ]
  const itemRows = lines.map(({ l, total: lt, unit }) => o.rollDesign === "Design2"
    ? `<div class="item-row item-row-grid">
<span class="grid-product"><span>${esc(l.productName)}</span>${extras(l).map((x) => `<span class="grid-extra">${esc(x)}</span>`).join("")}${l.notes ? `<span class="grid-extra">(${esc(l.notes)})</span>` : ""}</span>
<span class="grid-labels"><span>الكمية</span><span>السعر</span><span>الإجمالي</span></span>
<div class="grid-values"><span>${l.quantity}</span><span>${money(unit)}</span><span>${money(lt)}</span></div></div>`
    : `<div class="item-row">
<div class="item-name"><span class="item-name-product">${esc(l.productName)}</span>${extras(l).map((x) => `<span class="item-additions">${esc(x)}</span>`).join("")}</div>
${l.notes ? `<div class="item-additions item-note">(${esc(l.notes)})</div>` : ""}
<div class="item-meta">
<span class="meta-block"><span class="meta-label">كمية</span><span class="meta-val">${l.quantity}</span></span>
<span class="meta-block"><span class="meta-label">سعر</span><span class="meta-val">${money(unit)}</span></span>
<span class="meta-block"><span class="meta-label">اجمالي</span><span class="meta-val">${money(lt)} <span class="sar-text">${currencyMark(o.currency, "1.5em")}</span></span></span>
</div></div>`).join("")

  const badge = (v: string) => `<span class="order-badge">${esc(v)}</span>`
  const badges = (o.showOrderNumber && clean(inv.startNumber) ? badge(`الطلب #${clean(inv.startNumber)}`) : "") + (o.showOrderType && clean(inv.orderTypeName) ? badge(clean(inv.orderTypeName)) : "")

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
${badges ? `<div class="info-row order-badges">${badges}</div>` : ""}
${info("الوقت التاريخ", when)}
<div class="simple-line"></div>
${showCustomer ? info("اسم العميل", customerName) : ""}
${o.showEmployeeService ? info("موظف الخدمة", clean(inv.employeeName)) : ""}
${info("جوال العميل", clean(c?.phone))}
${o.isExempt ? "" : info("الرقم الضريبي للعميل", taxNo)}
${info("عنوان العميل", address)}
${info("السجل التجاري", clean(c?.commercialRegister))}
${info("رقم المبنى", clean(c?.buildingNumber))}
${info("الرقم الإضافي", clean(c?.additionalNumber))}
${info("الرمز البريدي", clean(c?.postalCode))}
${info("رقم الطلب", clean(inv.deviceNumber))}
${info("رقم الطاولة", clean(inv.tableNumber))}

<div class="items-section">${itemRows}</div>

<div class="totals-section">
<div class="total-row"><div class="label">عدد المنتجات</div><div class="value">${lines.length}</div></div>
${t.discount > 0 ? total("اجمالي الخصم", t.discount) : ""}
${o.isExempt ? "" : total("اجمالي قبل الضريبة", t.grandTotal - t.tax) + total("اجمالي الضريبة", t.tax)}
${total("الاجمالي النهائي", t.grandTotal)}
${o.showPaymentMethods ? inv.payments.map((p) => total(`نوع الدفع (${o.methodLabel(p.paymentMethod ?? "")})`, p.amount)).join("") : ""}
${o.showPaidAndRemaining ? total("المدفوع", inv.paid) + total("المتبقي", remaining) : ""}
</div>

${notes ? `<div class="notes-box"><div class="notes-title"><span>الملاحظات</span><span>Notes</span></div><div class="notes-content">${esc(notes)}</div></div>` : ""}
${footerNote ? `<div class="notes-box"><div class="notes-content" style="text-align:center">${esc(footerNote)}</div></div>` : ""}
${clean(b?.phone) ? `<div class="footer-phone">&nbsp; رقم الجوال <span class="row-value">${esc(clean(b?.phone))}</span></div>` : ""}
${branchAddress ? `<div class="footer-addr">${esc(branchAddress)}</div>` : ""}
${!o.isExempt && o.qrImage ? `<div class="qr-box"><img src="${esc(o.qrImage)}" alt="QR"></div>` : ""}
</div>`

  return { title: inv.number, paper: "roll80", font: "Alexandria", css: CSS, body }
}

// Design 3: the simplified receipt, one centered column with dashed rules.
const SIMPLE_CSS = `
html{width:100%}body{width:100%;max-width:80mm;margin:0 auto;padding:0;line-height:1.35;text-rendering:optimizeLegibility}
*{font-family:'Alexandria',Arial,sans-serif}
.s-page{width:100%;padding:3mm 3.5mm 5mm;text-align:center}
.s-logo{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1px 0 4px}
.s-logo img{max-height:65px;max-width:100%;height:auto;object-fit:contain;margin-bottom:4px}
.s-station{font-size:14pt;font-weight:700;line-height:1.5;padding-top:2px}
.s-small{font-size:7.5pt;line-height:1.7;color:#444}
.s-dash{border-top:1px dashed #000;margin:8px 0}.s-dash.strong{border-top:2px dashed #000;margin:12px 0}
.s-title{font-size:15pt;font-weight:700;line-height:1.5}
.s-title-en{font-size:7pt;font-weight:700;padding-bottom:2px}
.s-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:3px 0;font-size:9.5pt;font-weight:400}
.s-row .lbl{text-align:right;white-space:nowrap}.s-row .val{text-align:left}
.s-name{font-size:10pt;font-weight:700;text-align:right;padding:2px 0 4px}
.s-name-sub{font-size:7pt;font-weight:700}
.s-grand{font-size:9.5pt;font-weight:700;padding:4px 0}.s-grand .val{font-weight:700}
.s-qr{display:flex;justify-content:center;padding:14px 0 10px}.s-qr img{width:150px;height:150px}
.s-footer{font-size:7.5pt;color:#666;padding-top:4px;line-height:1.6;white-space:pre-line;text-align:center}
.s-footer+.s-footer{padding-top:2px}
@media print{@page{size:80mm auto;margin:0}}
`

const pad2 = (n: number) => String(n).padStart(2, "0")

/** The simplified tax invoice on the 80mm roll (design 3). */
function simplifiedRollDoc(inv: PrintInvoice, o: InvoiceRollOptions): PrintDoc {
  const b = o.branch
  const c = o.customer
  const names = o.showBranchName ? clean(b?.name) : clean(b?.shortName)
  const address = [b?.cityName, b?.district, b?.street].map(clean).filter(Boolean).join(" / ")
  const customerTaxNo = o.isExempt ? "" : clean(c?.taxNumber)
  const d = new Date(inv.date)
  const when = Number.isNaN(d.getTime()) ? clean(inv.date) : `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  const [titleAr, titleEn] = o.documentTitle ? [o.documentTitle.ar, o.documentTitle.en] : o.isExempt ? ["فاتورة", "Invoice"] : customerTaxNo ? ["فاتورة ضريبية", "Tax Invoice"] : ["فاتورة ضريبية مبسطة", "Simplified Tax Invoice"]

  const t = inv.totals
  const beforeTax = t.grandTotal - t.tax
  const vatPct = beforeTax > 0 ? Math.round((t.tax / beforeTax) * 100) : 15
  const remaining = Math.max(0, t.grandTotal - inv.paid)
  const payment = o.showPaymentMethods ? inv.payments.map((p) => o.methodLabel(p.paymentMethod ?? "")).filter(Boolean).join(" + ") : ""

  const row = (label: string, value: string) => `<div class="s-row"><span class="lbl">${esc(label)}</span><span class="val">${value}</span></div>`
  const sep = `<div class="s-dash"></div>`
  const strong = `<div class="s-dash strong"></div>`
  const num = (n: number) => `<bdi>${money(n)}</bdi>`

  const items = inv.lines.map((l) => {
    // A trailing "(...)" in the product name (e.g. the English name) prints smaller, as in the reference design.
    const m = /^(.*?)\s*(\([^()]*\))\s*$/.exec(l.productName ?? "")
    const name = m ? `${esc(m[1])} <span class="s-name-sub" dir="ltr">${esc(m[2])}</span>` : esc(l.productName)
    const unit = o.showUnits && l.unitName ? ` (${l.unitName})` : ""
    return `<div class="s-item"><div class="s-name">${name}</div>${row(`الكمية${unit}`, `<bdi>${money(l.quantity)}</bdi>`)}${row("السعر", num(l.unitPrice))}</div>`
  }).join(sep)

  const notes = clean(inv.notes)
  const footerNote = clean(b?.footerNote)
  const cashier = clean(inv.employeeName)

  const body = `<div class="s-page">
${b?.imageUrl ? `<div class="s-logo"><img src="${esc(b.imageUrl)}" alt="" crossorigin="anonymous"></div>` : ""}
${names ? `<div class="s-station">${esc(names)}</div>` : ""}
${address ? `<div class="s-small">${esc(address)}</div>` : ""}
${!o.isExempt && clean(b?.taxNumber) ? `<div class="s-small">الرقم الضريبي: <bdi>${esc(clean(b?.taxNumber))}</bdi></div>` : ""}
${strong}
<div class="s-title">${esc(titleAr)}</div>
<div class="s-title-en" dir="ltr">${esc(titleEn)}</div>
${strong}
${row(o.documentNumberLabel?.ar ?? "رقم الفاتورة", `<bdi>${esc(inv.number)}</bdi>`)}
${row("التاريخ", `<bdi>${esc(when)}</bdi>`)}
${cashier ? row("الكاشير", esc(cashier)) : ""}
${customerTaxNo ? row("الرقم الضريبي للعميل", `<bdi>${esc(customerTaxNo)}</bdi>`) : ""}
${sep}
${items}
${sep}
${o.isExempt ? "" : `${row("الإجمالي بدون ضريبة", num(beforeTax))}${row(`ضريبة القيمة المضافة ${vatPct}%`, num(t.tax))}${sep}`}
<div class="s-row s-grand"><span class="lbl">${o.isExempt ? "الإجمالي" : "الإجمالي شامل الضريبة"}</span><span class="val">${num(t.grandTotal)}</span></div>
${o.showPaidAndRemaining ? row("المدفوع", num(inv.paid)) + row("المتبقي", num(remaining)) : ""}
${payment ? `${strong}${row("طريقة الدفع", esc(payment))}` : ""}
${!o.isExempt && o.qrImage ? `<div class="s-qr"><img src="${esc(o.qrImage)}" alt="QR"></div>` : ""}
${notes ? `<div class="s-footer">${esc(notes)}</div>` : ""}
${footerNote ? `<div class="s-footer">${esc(footerNote)}</div>` : ""}
</div>`

  return { title: inv.number, paper: "roll80", font: "Alexandria", css: SIMPLE_CSS, body }
}
