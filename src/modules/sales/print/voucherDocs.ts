import { esc, type PrintDoc } from "@/shared/print"
import { tafqeet } from "@/lib/tafqeet"
import type { Branch } from "@/modules/branches/types"
import type { SalesOrderDto } from "../types"

export type VoucherOptions = { branch: Branch | undefined; customerPhone?: string | null }

/** The date as "dd/mm/yyyy", like the current system prints it. */
function dateText(raw?: string | null) {
  if (!raw) return "-"
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw.split("T")[0] : d.toLocaleDateString("en-GB")
}

const STYLE = `
@page { size: A4 portrait; margin: 0 !important; }
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Cairo', sans-serif; }
body { padding: 10mm; background: #fff; width: 100%; color: #334155; }
.header-grid { display: grid; grid-template-columns: 1fr 0.8fr 1fr; gap: 10px; margin-bottom: 8px; }
.header-col { display: flex; flex-direction: column; gap: 5px; }
.company-title { font-size: 14px; font-weight: 800; text-align: center; margin-bottom: 5px; padding: 5px; }
.meta-row { display: grid; grid-template-columns: 1.2fr 1.3fr 0.7fr; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; font-size: 10px; text-align: center; align-items: center; }
.meta-label-ar { font-weight: 800; padding: 4px; border-right: 1px solid #e2e8f0; background: #f1f5f9; white-space: nowrap; }
.meta-value { font-weight: 900; padding: 4px; border-right: 1px solid #e2e8f0; background: #fff; min-height: 24px; display: flex; align-items: center; justify-content: center; white-space: nowrap; }
.meta-label-en { font-weight: 700; padding: 4px; color: #64748b; font-size: 8px; white-space: nowrap; }
.logo-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; height: 100%; min-height: 80px; }
.val { color: #0f172a; font-weight: 800; }
.signatures { display: flex; }
.sig-line { border-bottom: 1.5px solid #cbd5e1; }
`

const STOCK_STYLE = `
.doc-type-bar { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-size: 16px; font-weight: 900; margin-bottom: 15px; border-radius: 4px; }
.customer-section { margin-bottom: 15px; }
.section-header { background: #f1f5f9; padding: 4px 15px; font-size: 13px; font-weight: 900; border: 1px solid #e2e8f0; border-bottom: none; display: inline-block; margin-left: auto; border-radius: 4px 4px 0 0; }
.customer-info-box { border: 1px solid #e2e8f0; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.info-group { display: flex; gap: 10px; font-size: 13px; font-weight: 800; }
.info-label { color: #64748b; }
.info-val { color: #0f172a; }
.v-separator { width: 1px; height: 20px; background: #e2e8f0; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; font-weight: 900; text-align: center; }
th .en-sub { display: block; font-size: 9px; font-weight: 700; color: #64748b; margin-top: -2px; }
td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; font-size: 13px; font-weight: 800; }
.signatures { margin-top: 30px; justify-content: space-around; }
.sig-block { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.sig-line { width: 180px; margin-bottom: 5px; }
.sig-text { font-size: 13px; font-weight: 900; }
`

const CLAIM_STYLE = `
.header-grid { margin-bottom: 20px; }
.title-section { text-align: center; margin-bottom: 20px; }
.title-badge { display: inline-block; background: #f1f5f9; padding: 8px 30px; border-radius: 6px; font-size: 18px; font-weight: 900; color: #0f172a; border: 1px solid #e2e8f0; }
.letter-body { background: #fbfcfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 25px; font-size: 12.5px; font-weight: 700; line-height: 2; text-align: justify; }
.row { margin-bottom: 5px; display: flex; align-items: flex-start; gap: 10px; }
.label { color: #64748b; font-weight: 900; width: 100px; display: inline-flex; justify-content: space-between; flex-shrink: 0; }
.extend-line { display: inline-block; border-bottom: 1.5px solid #cbd5e1; flex: 1; height: 10px; vertical-align: bottom; margin-right: 4px; }
.line-with-extend { display: flex; align-items: flex-end; gap: 6px; width: 100%; margin-bottom: 6px; }
.signatures { margin-top: 40px; justify-content: space-between; padding: 0 40px; }
.sig-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sig-line { width: 180px; height: 1.5px; background: #cbd5e1; border: 0; }
.sig-label { font-size: 14px; font-weight: 900; color: #334155; }
`

const page = (title: string, style: string, body: string): PrintDoc => ({
  title, paper: "a4", body: "",
  html: `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/><style>${STYLE}${style}</style></head><body>${body}</body></html>`,
})

/** The three-box header both vouchers open with. */
const header = (b: Branch | undefined, left: string, right: string) => `
<div class="header-grid">
  <div class="header-col"><div class="company-title">${esc(b?.name || "-")}</div>${left}</div>
  <div class="logo-container"><img src="${esc(b?.imageUrl || "")}" style="max-height: 70px; max-width: 100%; object-fit: contain;" /></div>
  <div class="header-col"><div class="company-title">${esc(b?.nameEn || b?.name || "-")}</div>${right}</div>
</div>`
const meta = (ar: string, value: string, en: string, style = "") => `<div class="meta-row"><div class="meta-label-ar">${ar}</div><div class="meta-value"${style ? ` style="${style}"` : ""}>${esc(value)}</div><div class="meta-label-en">${en}</div></div>`

/** سند مخزني: the items and quantities leaving the store, with signature lines. */
export function stockVoucherDoc(o: SalesOrderDto, { branch: b, customerPhone }: VoucherOptions): PrintDoc {
  const items = o.items ?? []
  const rows = items.map((l) => `<tr><td style="border-left: 1px solid #e2e8f0; padding: 10px; font-weight: 700;">${esc(l.productName)}</td><td style="border-left: 1px solid #e2e8f0; padding: 10px; font-weight: 700;">${esc(l.unitName || "قطعة")}</td><td style="padding: 10px; font-weight: 700;">${esc(l.quantity)}</td></tr>`).join("")
  const empty = Array(Math.max(0, 10 - items.length)).fill(`<tr style="height: 35px;"><td style="border-left: 1px solid #e2e8f0;"></td><td style="border-left: 1px solid #e2e8f0;"></td><td></td></tr>`).join("")
  const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  return page("اذن مخزني", STOCK_STYLE, `
${header(b, meta("الرقم الضريبي", b?.taxNumber || "-", "VAT No.") + meta("فاتورة رقم", o.orderNumber || "-", "INV No."),
    meta("سجل التجاري", b?.commercialRegister || "-", "Commercial No.") + meta("إصدار", `${dateText(o.orderDate)} | ${now}`, "Release D/T", "font-size: 7.5px;"))}
<div class="doc-type-bar"><div style="font-size: 18px; font-weight: 900; color: #1e293b;">اذن مخزني</div></div>
<div class="customer-section">
  <div style="display: flex; justify-content: flex-start;"><div class="section-header">بيانات العميل</div></div>
  <div class="customer-info-box">
    <div class="info-group"><span class="info-label">الاسم :</span><span class="info-val">${esc(o.customerName || "عميل نقدي")}</span></div>
    <div class="v-separator"></div>
    <div class="info-group"><span class="info-label">رقم الجوال :</span><span class="info-val">${esc(customerPhone || "-")}</span></div>
  </div>
</div>
<table>
  <thead><tr>
    <th style="width: 50%;">بيان الصنف<span class="en-sub">Item Des</span></th>
    <th style="width: 25%;">الوحدة<span class="en-sub">Unit</span></th>
    <th style="width: 25%;">الكمية<span class="en-sub">QTY</span></th>
  </tr></thead>
  <tbody>${rows}${empty}</tbody>
</table>
<div class="signatures">
  <div class="sig-block"><div class="sig-line"></div><div class="sig-text">توقيع المستلم</div></div>
  <div class="sig-block"><div class="sig-line"></div><div class="sig-text">أمين المستودع</div></div>
</div>`)
}

/** سند مطالبة: a payment-reminder letter for the invoice's total. */
export function claimVoucherDoc(o: SalesOrderDto, { branch: b, customerPhone }: VoucherOptions): PrintDoc {
  const date = dateText(o.orderDate)
  const amount = o.grandTotal ?? 0
  const customer = o.customerName || "-"
  const row = (label: string, value: string) => `<div class="row"><span class="label"><span>${label}</span><span>:</span></span><span class="val">${value}</span></div>`
  return page("نموذج خطاب مطالبة مالية", CLAIM_STYLE, `
${header(b, meta("الرقم الضريبي", b?.taxNumber || "-", "VAT No."), meta("سجل التجاري", b?.commercialRegister || "-", "Commercial No."))}
<div class="title-section"><div class="title-badge">نموذج خطاب مطالبة مالية</div></div>
<div style="text-align: right; padding: 0 25px; margin-bottom: 10px; font-size: 13px; font-weight: 800;"><span style="color: #334155; font-weight: 900;">التاريخ:</span><span class="val"> ${date}</span></div>
<div class="letter-body">
  ${row("المرسل", esc(b?.name || "-"))}
  ${row("المستلم", `${esc(customer)}${customerPhone ? ` | ${esc(customerPhone)}` : ""}`)}
  ${row("الموضوع", "مطالبة مالية بسداد مبلغ معين")}
  <div style="margin-top:12px;"><span class="val">السادة ${esc(customer)} تحية طيبة</span></div>
  <div style="margin-top:12px;">
    <div class="line-with-extend"><span>نود تذكيركم بأن الفاتورة رقم <span class="val">${esc(o.orderNumber || "-")}</span> الصادرة بتاريخ <span class="val">${date}</span> والمتعلقة</span><span class="extend-line"></span></div>
    <div class="line-with-extend"><span>بقيمة <span class="val">${amount.toFixed(2)} ﷼ (${esc(tafqeet(amount, "ar"))})</span> كان من المفترض سدادها بحلول</span><span class="extend-line"></span></div>
    <div style="margin-top: 4px;">وحتى تاريخ هذا الخطاب لم يتم استلام مبلغ الفاتورة.</div>
  </div>
  <div style="margin-top:12px;">لذلك نرجو منكم تسديد المبلغ المستحق خلال <span class="val">7</span> أيام من تاريخه. وذلك عبر الحساب البنكي المرفق في الفاتورة.</div>
  <div style="margin-top:12px; font-size: 11px; white-space: nowrap; overflow: visible;">في حال عدم السداد خلال المهلة المحددة سنضطر آسفين لاتخاذ الإجراءات القانونية اللازمة لتحصيل المستحقات.</div>
  <div style="margin-top:16px; text-align:center; font-size:16px; font-weight:900;">وتفضلوا بقبول فائق الاحترام.</div>
</div>
<div class="signatures">
  <div class="sig-item"><div class="sig-line"></div><div class="sig-label">التوقيع</div></div>
  <div class="sig-item"><div class="sig-line"></div><div class="sig-label">ختم الشركة</div></div>
</div>`)
}
