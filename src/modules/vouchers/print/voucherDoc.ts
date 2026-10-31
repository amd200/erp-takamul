import { esc, type PrintDoc } from "@/shared/print"
import { voucherNumber } from "../types"
import { tafqeet } from "@/lib/tafqeet"
import type { Branch } from "@/modules/branches/types"
import type { Voucher } from "../types"

export type VoucherOptions = {
  branch: Branch | undefined
  /** The treasury's name, printed on the "bank / cash" line. */
  treasuryName: string
  /** Copies on the page (setting "voucherPrintCount"); two or more share an A4 sheet. */
  copies: number
  /** The language of the amount in words. */
  lang: "ar" | "en"
}

const dash = (v: unknown) => (String(v ?? "").trim() === "" ? "-" : esc(String(v).trim()))
const money = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// The voucher as the Takamul web app prints it: bordered sheet, branch header, title box, dotted lines, signatures.
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:210mm;font-family:'Cairo',Arial,sans-serif;background:#fff;color:#000;font-size:12px;line-height:1.4}
.voucher-page{padding:5mm}
.voucher-page.many{display:grid;grid-template-columns:minmax(0,1fr);gap:4mm}
.voucher-copy{break-inside:avoid}
.voucher-border{border:1px solid #000;padding:10mm;width:100%;background:#fff}
.many .voucher-copy,.many .voucher-border{min-height:136mm}
.many .voucher-border{padding:6mm}
.voucher-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;width:100%;gap:15px}
.many .voucher-header{margin-bottom:10px}
.header-col-right{text-align:right;width:38%;display:flex;flex-direction:column;align-items:flex-start}
.header-col-center{text-align:center;width:24%;display:flex;justify-content:center;align-items:center}
.header-col-left{text-align:left;width:38%;display:flex;flex-direction:column;align-items:flex-end}
.branch-name-box{min-height:32px;width:100%;max-width:250px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:5px 10px;font-size:13px;font-weight:800;text-align:center;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.branch-logo{max-height:65px;max-width:130px;object-fit:contain}
.branch-logo-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #c0c0c0;padding:6px 12px;background:#fafafa;border-radius:4px}
.logo-text-top{font-size:20px;font-weight:900;color:#1e3a8a;line-height:1.1;letter-spacing:1px}
.logo-text-bottom{font-size:10px;font-weight:700;color:#555;text-transform:uppercase;margin-top:2px}
.header-info-tag{display:flex;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;font-size:11px;font-weight:700;margin-top:4px;width:100%;max-width:250px}
.tag-lbl-cell{background:#f3f4f6;padding:4px 6px;text-align:center;white-space:nowrap;font-size:9.5px}
.tag-val-cell{background:#fff;padding:4px 6px;flex:1;text-align:center;letter-spacing:.5px;font-family:Arial,sans-serif;font-size:9px;white-space:nowrap;border-left:1px solid #d1d5db;border-right:1px solid #d1d5db}
.sub-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;width:100%}
.many .sub-header{margin-bottom:12px}
.voucher-meta-table{border-collapse:collapse;font-size:10.5px;font-weight:700}
.voucher-meta-table td{padding:3px 4px;vertical-align:middle}
.meta-lbl-en{text-align:left;font-family:Arial,sans-serif;color:#444}
.meta-lbl-ar{text-align:right}
.meta-val{border-bottom:1.5px dashed #000;min-width:90px;text-align:center;padding-bottom:1px;font-size:11.5px}
.voucher-title-box{border:2px solid #000;border-radius:12px;padding:4px;text-align:center;background:#fff;display:inline-block;width:185px}
.voucher-title-ar{font-size:22px;font-weight:800;margin:0;line-height:1.1;padding-bottom:8px}
.voucher-title-en{font-size:10px;font-weight:700;color:#444;letter-spacing:.5px;margin:3px 0 0;font-family:Arial,sans-serif;text-transform:uppercase;padding-bottom:10px}
.voucher-amount-box{display:flex;align-items:center;gap:10px}
.amount-val{border:2px solid #000;padding:6px 20px;font-size:22px;font-weight:800;text-align:center;min-width:125px;background:#fff;font-family:Arial,sans-serif}
.amount-unit{text-align:center;font-size:12px;font-weight:700;line-height:1.1}
.content-rows{margin-bottom:20px;width:100%}
.many .content-rows{margin-bottom:0}
.voucher-line-item{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;font-size:12px;font-weight:700;width:100%}
.many .voucher-line-item{margin-bottom:8px}
.line-lbl-ar{white-space:nowrap;min-width:130px;text-align:right;padding-left:10px;font-size:12px}
.line-lbl-en{white-space:nowrap;min-width:140px;text-align:left;padding-right:10px;font-family:Arial,sans-serif;font-size:10px;color:#333}
.line-dots{flex:1;border-bottom:1.5px dotted #000;text-align:center;padding-bottom:8px;font-size:12px;font-weight:700}
.voucher-signatures{display:flex;justify-content:space-between;margin-top:35px;padding:0 40px;width:100%}
.many .voucher-signatures{margin-top:15px}
.sig-block{text-align:center;width:180px}
.sig-title{font-size:11px;font-weight:700;display:flex;justify-content:center;gap:6px;align-items:center}
.sig-title-en{color:#444;font-family:Arial,sans-serif;font-size:10px}
.sig-line{border-bottom:1.5px solid #000;margin-top:30px;width:100%}
.many .sig-line{margin-top:18px}
@media print{@page{size:A4 portrait;margin:0}}
`

// The PDF capture draws text in these boxes a few pixels low, so they are centred explicitly there.
const PDF_CSS = `
.amount-val{height:52px;padding:0 20px;display:flex;align-items:center;justify-content:center;line-height:1}
.amount-val>span{display:block;transform:translateY(-7px)}
.amount-unit{display:flex;flex-direction:column;align-items:center;justify-content:center;align-self:center}
.amount-unit svg{display:block}
.branch-name-box{height:32px;min-height:32px;padding:0 10px;display:flex;align-items:center;justify-content:center}
.branch-name-box>span{display:block;transform:translateY(-6px)}
.tag-lbl-cell{padding-top:0;padding-bottom:0;display:flex;align-items:center;justify-content:center}
.tag-lbl-cell>span{display:block;transform:translateY(-4px)}
`

const CURRENCY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m20 19.5-5.5 1.2"/><path d="M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2"/><path d="m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16"/><path d="M20 10 4 13.5"/></svg>`

/** A receipt (قبض) or payment (صرف) voucher on A4, with one to five copies on the sheet. */
export function voucherDoc(v: Voucher, o: VoucherOptions): PrintDoc {
  const b = o.branch
  const receipt = v.kind === "receipt"
  const d = new Date(v.transactionDate)
  const dateText = Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB")
  const logo = b?.imageUrl
    ? `<img src="${esc(b.imageUrl)}" class="branch-logo" alt="" crossorigin="anonymous">`
    : `<div class="branch-logo-placeholder"><div class="logo-text-top">تكامل</div><div class="logo-text-bottom">البيانات</div></div>`

  const one = `<div class="voucher-copy"><div class="voucher-border">
<div class="voucher-header" dir="rtl">
  <div class="header-col-right">
    <div class="branch-name-box"><span>${esc(b?.name ?? "")}</span></div>
    <div class="header-info-tag" dir="ltr"><div class="tag-lbl-cell" style="font-size:8px"><span>.VAT No.</span></div><div class="tag-val-cell">${esc(b?.taxNumber ?? "")}</div><div class="tag-lbl-cell"><span>الرقم الضريبي</span></div></div>
  </div>
  <div class="header-col-center">${logo}</div>
  <div class="header-col-left">
    <div class="branch-name-box"><span>${esc(b?.nameEn ?? "")}</span></div>
    <div class="header-info-tag" dir="ltr"><div class="tag-lbl-cell" style="font-size:7.5px"><span>.Commercial No.</span></div><div class="tag-val-cell">${esc(b?.commercialRegister ?? "")}</div><div class="tag-lbl-cell"><span>السجل التجاري</span></div></div>
  </div>
</div>

<div class="sub-header" dir="rtl">
  <div style="width:30%;display:flex;justify-content:flex-start"><table class="voucher-meta-table">
    <tr><td class="meta-lbl-en">Date :</td><td class="meta-val">${esc(dateText)}</td><td class="meta-lbl-ar">: التاريخ</td></tr>
    <tr><td class="meta-lbl-en">No :</td><td class="meta-val">${dash(voucherNumber(v))}</td><td class="meta-lbl-ar">: رقم</td></tr>
  </table></div>
  <div style="width:40%;display:flex;justify-content:center"><div class="voucher-title-box">
    <h1 class="voucher-title-ar">${receipt ? "سند قبض" : "سند صرف"}</h1>
    <p class="voucher-title-en">${receipt ? "RECEIPT VOUCHER" : "PAYMENT VOUCHER"}</p>
  </div></div>
  <div style="width:30%;display:flex;justify-content:flex-end"><div class="voucher-amount-box" dir="ltr">
    <div class="amount-val"><span>${money(v.amount)}</span></div>
    <div class="amount-unit">${CURRENCY_ICON}<div style="font-family:Arial;font-size:10px;font-weight:700">SR</div></div>
  </div></div>
</div>

<div class="content-rows" dir="rtl">
  <div class="voucher-line-item"><div class="line-lbl-ar">${receipt ? "استلمنا من السيد :" : "يصرف للسيد :"}</div><div class="line-dots">${dash(v.partyName)}</div><div class="line-lbl-en" dir="ltr">${receipt ? "Received From M/s." : "Pay To M/s."}</div></div>
  <div class="voucher-line-item"><div class="line-lbl-ar">مبلغ وقدره :</div><div class="line-dots">${esc(tafqeet(v.amount, o.lang))}</div><div class="line-lbl-en" dir="ltr">The sum of S.R.</div></div>
  <div class="voucher-line-item"><div class="line-lbl-ar">وذلك عن / يمثل :</div><div class="line-dots">${dash(v.description)}</div><div class="line-lbl-en" dir="ltr">Being</div></div>
  <div class="voucher-line-item"><div class="line-lbl-ar">طريقة الدفع / البنك :</div><div class="line-dots">${dash(o.treasuryName || "نقداً")}</div><div class="line-lbl-en" dir="ltr">Bank / Cash</div></div>
</div>

<div class="voucher-signatures" dir="rtl">
  <div class="sig-block"><div class="sig-title"><span>المستلم</span><span class="sig-title-en">Receiver</span></div><div class="sig-line"></div></div>
  <div class="sig-block"><div class="sig-title"><span>المحاسب</span><span class="sig-title-en">Accountant</span></div><div class="sig-line"></div></div>
</div></div></div>`

  const copies = Math.min(5, Math.max(1, Math.round(o.copies) || 1))
  return {
    title: voucherNumber(v),
    paper: "a4",
    font: "Cairo",
    css: CSS,
    pdfCss: PDF_CSS,
    body: `<div class="voucher-page${copies > 1 ? " many" : ""}">${one.repeat(copies)}</div>`,
  }
}
