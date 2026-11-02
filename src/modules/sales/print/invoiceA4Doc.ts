import { esc, type PrintDoc } from "@/shared/print"
import type { Branch } from "@/modules/branches/types"
import type { Customer } from "@/modules/customers/types"
import { lineAmounts } from "../totals"
import { renderDesign3A4, type Design3Input } from "./design3"
import { renderDesign4A4 } from "./design4"
import type { PrintInvoice } from "./printInvoice"

export type InvoiceA4Options = {
  /** Reuses the selected invoice layout for another document, such as a quotation. */
  documentTitle?: { ar: string; en: string }
  documentNumberLabel?: { ar: string; en: string }
  branch: Branch | undefined
  customer: Customer | undefined
  /** Tax exempt: the tax columns and the "tax invoice" title are left out. */
  isExempt: boolean
  showPaymentMethods: boolean
  showPaidAndRemaining: boolean
  /** Short names are printed unless the branch asked for the full ones. */
  showBranchName: boolean
  showHeaderAndFooter: boolean
  /** The blue variant of the layout (setting "Design2"). */
  blue: boolean
  /** The tax-invoice layouts (settings "Design3" and "Design4"); without it the standard layout (or its blue variant) prints. */
  design?: "Design3" | "Design4"
  /** ZATCA QR as an image data URL, when one is available. */
  qrImage?: string | null
  /** Payment method names by method key, for the "payment type" rows. */
  methodLabel: (method: string) => string
}

const dash = (v: unknown) => (v === null || v === undefined || String(v).trim() === "" ? "-" : esc(String(v).trim()))
const money = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(2)
const nb = (s: string) => s.replace(/ /g, "&nbsp;")

// The A4 invoice as the Takamul web app prints it: grey header boxes, bordered customer and totals tables.
const CSS = `
@page{size:A4 portrait;margin:0}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Alexandria',Arial,sans-serif;font-weight:500}
body{background:#fff;width:210mm;min-height:297mm;color:#1a1a1a;font-size:10px;line-height:1.4;padding:10mm 15mm}
.hidden{display:none!important}
.header-grid{display:grid;grid-template-columns:2fr 1fr 2fr;gap:12px;margin-bottom:5px}
.header-grid.without-logo{grid-template-columns:1fr 1fr}
.header-col{display:flex;flex-direction:column;justify-content:space-between;gap:6px;align-self:stretch;min-width:0}
.company-title{flex:1;font-size:11px;font-weight:700;text-align:center;padding:6px 10px 11px;color:#000;background:#f2f2f2;border-radius:3px;display:flex;align-items:center;justify-content:center;word-spacing:5px}
.meta-row{flex:1;display:flex;width:100%;align-items:stretch;gap:4px}
.meta-label-ar{width:75px;flex:0 0 75px;font-size:9px;padding:6px 5px 11px;background:#f2f2f2;border-radius:3px;display:flex;align-items:center;justify-content:center;text-align:center;color:#000;font-weight:700;white-space:nowrap;word-spacing:2px}
.meta-value{flex:1;font-size:10px;padding:6px 10px 11px;background:#f2f2f2;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#000;white-space:nowrap;font-weight:700;letter-spacing:.5px;overflow:hidden}
.meta-label-en{width:60px;flex:0 0 60px;font-size:7px;padding:6px 5px 11px;color:#000;background:#f2f2f2;border-radius:3px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:600;white-space:nowrap}
.logo-container{flex-direction:column;gap:4px;border-radius:3px;display:flex;align-items:center;justify-content:center;min-height:90px;background:#f2f2f2;align-self:stretch;min-width:0}
.doc-type-container{display:grid;grid-template-columns:2fr 1fr 2fr;gap:12px;margin-bottom:15px}
.doc-type-item{background:#f2f2f2;border-radius:4px;padding:10px 6px 15px;font-size:13px;color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;text-align:center;word-spacing:4px}
.section-header{background:#f0f0f0;padding:3px 12px 6px;font-size:11px;font-weight:600;border:1.5px solid #000;border-bottom:none;display:inline-block;white-space:nowrap;border-radius:3px 3px 0 0;color:#000}
.customer-box{margin-bottom:18px;border-radius:0 3px 3px 3px;overflow:hidden}
.cust-tbl{width:100%;border-collapse:collapse;table-layout:fixed}
.cust-tbl td{border:1px solid #000;vertical-align:middle;padding:8px 15px}
.cust-lbl{width:20%;background:#f8f8f8;font-size:10px;color:#444;text-align:right;border-left:1.5px solid #000;white-space:nowrap;word-spacing:4px}
.cust-val{width:30%;font-size:10px;color:#000;text-align:right}
.addr-row td{font-size:9.5px;color:#1a1a1a;text-align:right;line-height:1.5}
.items-table{width:100%;border-collapse:collapse;table-layout:fixed}
.items-table th{background:#f0f0f0;border:1px solid #000;padding:8px 10px;font-size:11px;font-weight:600;text-align:center;color:#1a1a1a;vertical-align:middle;white-space:nowrap}
.items-table th .en-sub{display:block;font-size:7.5px;color:#555;margin-top:1px}
.items-table td{border:1px solid #000;padding:8px 10px;text-align:center;font-weight:700;font-size:9pt;vertical-align:middle}
.items-table tr{break-inside:avoid}
.footer-section{display:grid;gap:10px;margin-top:15px;align-items:stretch;break-inside:avoid}
.totals-table{width:100%;table-layout:fixed;border-collapse:collapse;border:1.5px solid #000}
.totals-table td{border:1px solid #000;padding:8px;text-align:center;font-size:11px;color:#000;vertical-align:middle;word-spacing:4px}
.totals-table .lbl-en{width:34%;background:#fff;font-weight:600}
.totals-table .val-cell{width:24%;font-weight:700;font-size:11px}
.totals-table .lbl-ar{width:42%;background:#fafafa;font-weight:600}
.totals-table .net-total-row td{background:#f2f2f2;font-weight:700;font-size:12px;padding:10px 12px}
.qr-barcode-container{width:110px;border:1.5px solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;gap:8px}
.qr-code-final{width:100%;height:auto;aspect-ratio:1;object-fit:contain}
.inv-no-small{font-size:8px;font-weight:700;margin-top:-4px}
.full-width-bar{border:1.5px solid #000;background:#f2f2f2;padding:10px;margin-top:10px;text-align:center;font-weight:600;font-size:11px;color:#000;display:flex;flex-direction:column;gap:4px;break-inside:avoid}
.notes-box{background:#fafafa;padding:8px 12px;border:1.5px solid #000;margin-top:10px;font-size:11px;color:#000;display:flex;justify-content:center;gap:8px;break-inside:avoid}
.payment-stamp-row{display:grid;grid-template-columns:1fr 1.35fr;gap:10px;margin-top:12px;direction:rtl;break-inside:avoid}
.stamp-box{min-height:96px;display:flex;align-items:center;justify-content:center}
.stamp-box img{max-width:100%;max-height:90px;object-fit:contain}
.iban-box{min-height:66px;border:1.5px solid #000;padding:7px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:#fff;text-align:center}
.iban-label{font-size:12px;font-weight:700}
.iban-value{direction:ltr;font-size:13px;font-weight:700;letter-spacing:.35px}
.blue .company-title,.blue .doc-type-item:nth-child(2),.blue .section-header{background:#cdebf7}
.blue .company-title{flex-direction:column}
@media print{body{min-height:0;width:auto}}
`

/** The A4 sales invoice, laid out like the one the Takamul web app prints. */
export function invoiceA4Doc(inv: PrintInvoice, o: InvoiceA4Options): PrintDoc {
  const b = o.branch
  const c = o.customer
  const lines = inv.lines.map((l) => {
    const a = l.amounts ?? lineAmounts(l)
    return { l, a: { ...a, net: a.total - a.tax } }
  })
  const date = new Date(inv.date)
  const validDate = !Number.isNaN(date.getTime())
  const dateText = validDate ? date.toLocaleDateString("en-GB") : "-"
  const timeText = validDate ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"

  const taxNo = (c?.taxNumber ?? "").trim()
  const simplified = !taxNo
  const titleAr = o.documentTitle?.ar ?? (o.isExempt ? "فاتورة" : simplified ? "فاتورة ضريبية مبسطة" : "فاتورة ضريبية")
  const titleEn = o.documentTitle?.en ?? (o.isExempt ? "INVOICE" : simplified ? "SIMPLIFIED TAX INVOICE" : "TAX INVOICE")

  const customerAddress = [c?.countryName && !/^(sa|sau|saudi arabia|السعودية|المملكة العربية السعودية)$/i.test(c.countryName.trim()) ? c.countryName : "", c?.cityName, c?.district, c?.street].filter(Boolean).join(" / ")
  const names = o.showBranchName ? { ar: b?.name ?? "-", en: b?.nameEn ?? "-" } : { ar: b?.shortName?.trim() ?? "", en: b?.shortNameEn?.trim() ?? "" }
  const head = o.showHeaderAndFooter

  const t = inv.totals
  // Saved invoices can return subTotal after discount; do not subtract the discount again.
  const baseBeforeVat = t.grandTotal - t.tax
  const paid = inv.paid
  const remaining = Math.max(0, t.grandTotal - paid)
  const itemsCount = lines.reduce((s, { l }) => s + l.quantity, 0)
  const showUnits = lines.some(({ l }) => l.unitName)

  const rows = lines.map(({ l, a }) => `<tr>
<td style="text-align:center;font-size:8.5pt;word-spacing:2px">${dash(l.name)}</td>
${showUnits ? `<td>${dash(l.unitName)}</td>` : ""}<td>${l.quantity}</td><td>${money(l.unitPrice)}</td>
${o.isExempt ? "" : `<td>${money(a.net)}</td><td>${money(a.tax)}</td>`}<td>${money(a.total)}</td></tr>`).join("")

  const th = (ar: string, en: string, w: string) => `<th style="width:${w}">${ar}<span class="en-sub">${en}</span></th>`
  const nameWidth = o.isExempt ? (showUnits ? "55%" : "65%") : showUnits ? "33%" : "43%"
  const tr = (ar: string, v: string, en: string, cls = "") => `<tr${cls ? ` class="${cls}"` : ""}><td class="lbl-ar">${nb(ar)}</td><td class="val-cell">${v}</td><td class="lbl-en">${en}</td></tr>`

  // Designs 3 and 4 are complete documents of their own (bilingual tax invoice layouts).
  if (o.design) {
    const plain = (v: unknown) => String(v ?? "").trim()
    const orDash = (v: unknown) => plain(v) || "-"
    const input: Design3Input = {
      t: (_key: string, fallback?: string) => fallback ?? _key,
      branch: { ...(b ?? {}) } as Record<string, unknown>,
      docTitleAr: titleAr,
      docTitleEn: titleEn,
      invNoLabel: o.documentNumberLabel ? [o.documentNumberLabel.en, o.documentNumberLabel.ar] : ["Invoice No.", "رقم الفاتورة"],
      invoiceNo: inv.number,
      dateVal: inv.date,
      formattedTime: timeText,
      remarks: inv.notes ?? "",
      party: {
        isSupplier: false, name: orDash(inv.customerName), phone: orDash(c?.phone), taxNo: orDash(taxNo), commercial: orDash(c?.commercialRegister),
        city: plain(c?.cityName), district: plain(c?.district), street: plain(c?.street), building: orDash(c?.buildingNumber), subNo: orDash(c?.additionalNumber), postal: orDash(c?.postalCode),
      },
      rows: lines.map(({ l, a }) => ({ name: l.name, additionsText: "", note: "", price: l.unitPrice, qty: l.quantity, subTotal: a.net, discount: a.discount, vatPct: l.taxRate, taxAmt: a.tax, netTotal: a.total })),
      isExempt: o.isExempt,
      showHeaderAndFooterInPrint: o.showHeaderAndFooter,
      branchNames: { showBranchName: o.showBranchName },
      totals: { taxable: t.subTotal, discount: t.discount, vat: t.tax, final: t.grandTotal, paid, remaining },
      showPaidAndRemaining: o.showPaidAndRemaining,
      payments: o.showPaymentMethods ? inv.payments.map((p) => ({ name: o.methodLabel(p.method), amount: p.amount })) : [],
      qr: o.isExempt ? null : { src: o.qrImage ?? null },
    }
    const html = o.design === "Design4" ? renderDesign4A4({ ...input, partyAddress: customerAddress, invNoLabel: o.documentNumberLabel ? [o.documentNumberLabel.en, o.documentNumberLabel.ar] : ["Invoice number", "رقم الفاتورة"] }) : renderDesign3A4(input)
    return { title: inv.number, paper: "a4", body: "", html }
  }

  const body = `<div class="${o.blue ? "blue" : ""}">
<div class="header-grid${head ? "" : " without-logo"}">
  <div class="header-col">
    <div class="company-title${head ? "" : " hidden"}">${nb(esc(names.ar))}</div>
    <div class="meta-row${head ? "" : " hidden"}"><div class="meta-label-ar">الرقم&nbsp;الضريبي</div><div class="meta-value">${dash(b?.taxNumber)}</div><div class="meta-label-en">VAT No.</div></div>
    <div class="meta-row"><div class="meta-label-ar">${nb(esc(o.documentNumberLabel?.ar ?? "فاتورة رقم"))}</div><div class="meta-value">${dash(inv.number)}</div><div class="meta-label-en">${esc(o.documentNumberLabel?.en ?? "INV No.")}</div></div>
  </div>
  ${head ? `<div class="logo-container">${b?.imageUrl ? `<img src="${esc(b.imageUrl)}" alt="" style="max-height:85px;max-width:100%;object-fit:contain" crossorigin="anonymous">` : `<div style="font-size:14px;font-weight:700">Logo / اللوجو</div>`}</div>` : ""}
  <div class="header-col">
    <div class="company-title${head ? "" : " hidden"}">${nb(esc(names.en))}</div>
    <div class="meta-row${head ? "" : " hidden"}"><div class="meta-label-ar">سجل&nbsp;التجاري</div><div class="meta-value">${dash(b?.commercialRegister)}</div><div class="meta-label-en">Commercial No.</div></div>
    <div class="meta-row"><div class="meta-label-ar">إصدار</div><div class="meta-value" style="font-size:8px">${dateText} | ${timeText}</div><div class="meta-label-en">Release D/T</div></div>
  </div>
</div>

<div class="doc-type-container">
  <div class="doc-type-item">${o.documentTitle ? esc(o.documentTitle.ar) : "فاتورة مبيعات"}</div>
  ${o.isExempt ? `<div class="doc-type-item" style="visibility:hidden"></div>` : `<div class="doc-type-item" style="font-size:10px">${esc(o.documentTitle?.en ?? titleAr)}</div>`}
  <div class="doc-type-item">اسم&nbsp;المستخدم : ${dash(inv.createdBy || inv.employeeName)}</div>
</div>

<div style="margin-bottom:10px">
  <div style="display:flex;justify-content:flex-start"><div class="section-header">بيانات العميل</div></div>
  <div class="customer-box"><table class="cust-tbl">
    <tr><td class="cust-lbl">الاسم :</td><td class="cust-val">${dash(inv.customerName)}</td><td class="cust-lbl">رقم الجوال :</td><td class="cust-val">${dash(c?.phone)}</td></tr>
    <tr><td class="cust-lbl">الرقم الضريبي :</td><td class="cust-val">${dash(taxNo)}</td><td class="cust-lbl">السجل التجاري :</td><td class="cust-val">${dash(c?.commercialRegister)}</td></tr>
    <tr class="addr-row"><td colspan="2" style="border-left:1px solid #000">العنوان الوطني : ${dash(customerAddress)}</td>
      <td colspan="2">الرمز البريدي: ${dash(c?.postalCode)} ، الرقم الفرعي: ${dash(c?.additionalNumber)} ، رقم المبنى: ${dash(c?.buildingNumber)}</td></tr>
  </table></div>
</div>

<table class="items-table"><thead><tr>
  ${th("بيان الصنف", "Item Des", nameWidth)}${showUnits ? th("الوحدة", "Unit", "10%") : ""}${th("الكمية", "QTY", "10%")}${th("السعر", "price", "10%")}
  ${o.isExempt ? "" : th("اجمالي فرعي", "Sub Total", "12%") + th("الضريبة", "Tax", "10%")}${th("الاجمالي النهائي", "Net Total", "15%")}
</tr></thead><tbody>${rows}</tbody></table>

<div class="footer-section" style="grid-template-columns:${o.isExempt ? "minmax(0,1fr)" : "110px minmax(0,1fr)"}">
  ${o.isExempt ? "" : `<div class="qr-barcode-container">${o.qrImage ? `<img src="${esc(o.qrImage)}" class="qr-code-final" alt="QR">` : `<div style="font-size:8px;color:#555;text-align:center">QR Code Unavailable</div>`}<div class="inv-no-small">${dash(inv.number)}</div></div>`}
  <table class="totals-table">
    ${tr("عدد المنتجات", String(itemsCount), "Items")}
    ${tr("قيمة الخصم", money(t.discount), "Discount Amount")}
    ${t.discount > 0 ? tr("الاجمالي بعد الخصم", money(baseBeforeVat), "After Discount") : ""}
    ${o.isExempt ? "" : tr("اجمالي السعر قبل الضريبة", money(baseBeforeVat), "Tot Before VAT") + tr("ضريبة القيمة المضافة", money(t.tax), "Total VAT")}
    ${tr("الإجمالي النهائي", money(t.grandTotal), "NET TOTAL", "net-total-row")}
    ${o.showPaidAndRemaining ? tr("المدفوع", money(paid), "PAID AMOUNT", "net-total-row") : ""}
    ${o.showPaymentMethods ? inv.payments.map((p) => tr(`نوع الدفع (${esc(o.methodLabel(p.method))})`, money(p.amount), "Payment Type")).join("") : ""}
    ${o.showPaidAndRemaining ? tr("المتبقي", money(remaining), "REMAINING", "net-total-row") : ""}
  </table>
</div>
${o.blue ? `<div class="payment-stamp-row"><div class="stamp-box">${b?.stampImageUrl ? `<img src="${esc(b.stampImageUrl)}" alt="" crossorigin="anonymous">` : ""}</div><div class="iban-box"><span class="iban-label">رقم الحساب الدولي : آيبان</span><span class="iban-value">${b?.iban?.trim() ? esc(b.iban.trim()) : "____________________________"}</span></div></div>` : ""}
${inv.notes ? `<div class="notes-box"><div>${esc(inv.notes)}</div></div>` : ""}
${b?.footerNote ? `<div class="notes-box"><div>${esc(b.footerNote)}</div></div>` : ""}
${head ? `<div class="full-width-bar"><div>العنوان : ${dash([b?.cityName, b?.stateName, b?.district, b?.street].filter(Boolean).join(" / ") || b?.locationAddress)}</div>
  <div style="font-size:10px">الرمز البريدي: ${dash(b?.postalCode)} | الرقم الفرعي: ${dash(b?.subNumber)} | رقم المبنى: ${dash(b?.buildingNumber)} | رقم الجوال : ${dash(b?.phone)}</div></div>` : ""}
</div>`

  return { title: inv.number, paper: "a4", font: "Alexandria", css: CSS, body }
}
