import { getA4BranchDisplayNames, type BranchNameOptions, type Design3Input } from "./design3";

type Design4Input = Design3Input & { dueDate?: string; partyAddress?: string };
const escapeHTML = (value: unknown): string => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const money = (value: number) => Number(value).toFixed(2);
const date = (value: unknown): string => {
  const d = value ? new Date(String(value)) : null;
  return d && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "-";
};

/** A4 layout matching the supplied bilingual invoice reference. */
export const renderDesign4A4 = (input: Design4Input): string => {
  const { branch, party, rows, totals, isExempt, qr, showHeaderAndFooterInPrint } = input;
  const e = escapeHTML;
  const branchNames: BranchNameOptions = input.branchNames ?? { showBranchName: true };
  const displayNames = getA4BranchDisplayNames(branch, branchNames.showBranchName);
  const docTitleEn = input.docTitleEn === input.docTitleEn.toUpperCase()
    ? input.docTitleEn.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
    : input.docTitleEn;
  const asset = (path: string) => `${typeof window === "undefined" ? "" : window.location.origin}${import.meta.env.BASE_URL}${path}`;
  const countryAr = /^SA(U)?$/i.test(String(branch.countryName || "").trim()) ? "المملكة العربية السعودية" : branch.countryName;
  const addressAr = [branch.buildingNumber, branch.street, branch.district, branch.cityName, branch.postalCode, countryAr].filter(Boolean).join("، ") || branch.address || "";
  const customerAddress = input.partyAddress || [party.city, party.district, party.street].filter(Boolean).join("، ");
  const infoRow = (en: string, ar: string, value: string) => `<tr><td class="label-en">${en}</td><td class="info-value">${e(value)}</td><td class="label-ar">${ar}</td></tr>`;
  const totalRow = (en: string, ar: string, value: number) => `<tr><td class="amount" dir="ltr">${money(value)}</td><td class="currency">&#x20c1;</td><td class="total-label"><span class="total-label-text"><bdi dir="ltr">${en}</bdi> <bdi dir="rtl">${ar}</bdi></span></td></tr>`;
  const remarks = [input.remarks, branch.footerNote].filter(Boolean).join("\n\n");
  const stampImage = String(branch.stampImageUrl || "").trim();
  return `<!DOCTYPE html><html lang="ar" dir="ltr" data-invoice-design="4"><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&display=swap" rel="stylesheet" crossorigin="anonymous"/>
<style>
@font-face { font-family:Wafeq; src:url('${e(asset("invoice-design4/wafeq-bold.woff2"))}') format('woff2'); font-weight:700; font-display:block; }
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; margin:0; padding:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
html { background:#fff; } body { color:#000; font-family:'Alexandria',Arial,sans-serif; font-weight:400; font-synthesis:none; font-size:8pt; line-height:1.35; padding:10.5mm 10.5mm 5mm; }
.invoice-page { --item-cell-inset:5pt; min-height:281mm; display:flex; flex-direction:column; }
.content { flex:1; }
.company { display:grid; grid-template-columns:1fr 36mm 1fr; gap:8mm; padding-bottom:1mm; border-bottom:1.5pt solid #ccd8e8; font-size:9pt; line-height:1.5; }
.company-en { text-align:left; } .company-ar { text-align:right; direction:rtl; }
.company h2 { font-size:11pt; line-height:1.4; font-weight:600; margin:0 0 3pt; white-space:nowrap; }
.company p { overflow-wrap:anywhere; margin-bottom:1pt; }
.company p:empty { display:none; }
.logo-container { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; }
.logo { width:36mm; height:22mm; object-fit:contain; }
h1 { text-align:center; font-size:21pt; font-weight:600; line-height:1.25; margin:4mm 0 4mm; white-space:normal; }
table { width:100%; border-collapse:collapse; }
.customer { border:0.6pt solid #ccd8e8; table-layout:fixed; }
.customer td { padding:1pt 8pt; height:14pt; border-bottom:0.6pt solid #ccd8e8; }
.label-en { width:25%; font-weight:600; text-align:left; } .label-ar { width:25%; font-weight:600; text-align:right; direction:rtl; }
.info-value { width:50%; text-align:center; unicode-bidi:plaintext; }
.meta { border:0.6pt solid #ccd8e8; border-top:0; display:grid; grid-template-columns:1fr 1fr; padding:1pt 0; }
.meta-half:first-child { border-right:0.6pt solid #ccd8e8; }
.meta-line { display:grid; grid-template-columns:1fr 1fr 1fr; align-items:center; padding:0 8pt; min-height:12pt; }
.meta-line b { font-weight:600; } .meta-line span { text-align:center; } .meta-line .ar { font-weight:600; text-align:right; direction:rtl; }
.items { table-layout:fixed; border:0.6pt solid #ccd8e8; margin-top:7mm; }
.items th { height:36pt; padding:5pt var(--item-cell-inset); border-bottom:0.6pt solid #ccd8e8; font-size:7.5pt; font-weight:600; vertical-align:middle; text-align:right; white-space:nowrap; }
.items th span { display:block; font-weight:600; }
.items td { padding:6pt var(--item-cell-inset); text-align:right; vertical-align:top; border-bottom:0.6pt solid #ccd8e8; }
.items tr { break-inside:avoid; } .items .description { direction:rtl; text-align:right; overflow-wrap:anywhere; } .items .product-name { font-weight:700; } .items .sub { font-size:8pt; font-weight:400; margin-top:2pt; } .items .net { font-weight:400; }
.summary { display:flex; justify-content:space-between; align-items:flex-start; break-inside:avoid; margin-top:2mm; }
.totals { width:64%; table-layout:fixed; margin-top:3mm; font-size:8pt; } .totals td { padding:5pt 0; font-weight:700; vertical-align:middle; }
/* 19.375% of the 64%-wide totals table matches the 12.4% line amount column. */
.totals .amount { padding-right:var(--item-cell-inset); text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; } .totals .currency { width:16mm; text-align:left; padding-left:10pt; font-family:Wafeq,Arial,sans-serif; } .total-label { text-align:left; }
.total-label-text { display:inline-flex; align-items:baseline; gap:3pt; white-space:nowrap; }
.qr { width:33%; text-align:right; } .qr img { width:26.4mm; height:26.4mm; object-fit:contain; } .qr-caption { font-size:5.6pt; line-height:1.4; margin-top:1mm; } .qr-caption > div[dir="rtl"] { font-size:4.8pt; white-space:nowrap; margin-bottom:1mm; } .qr-caption > div:not([dir]) { font-size:4.8pt; white-space:nowrap; }
.notes { display:grid; grid-template-columns:48mm 1fr; gap:7mm; margin-top:7mm; break-inside:avoid; }
.stamp { width:48mm; height:auto; } .notes-text { text-align:right; direction:rtl; font-size:8pt; } .notes-title { font-weight:600; line-height:1.5; margin-bottom:3mm; } .remarks { font-weight:400; white-space:pre-wrap; line-height:2; overflow-wrap:anywhere; }
.footer { display:grid; grid-template-columns:3fr 1fr 1fr; font-size:7pt; padding-top:5mm; align-items:end; }
.footer-company { text-align:center; color:#525d72; } .footer-page { text-align:center; } .footer-number { text-align:right; }
@media print { body { padding:10.5mm 10.5mm 5mm; } thead { display:table-header-group; } }
</style></head><body><div class="invoice-page"><main class="content">
${showHeaderAndFooterInPrint ? `<header class="company"><div class="company-en"><h2>${e(displayNames.en)}</h2><p dir="rtl">${e(addressAr)}</p><p>${e(branch.email)}</p><p>${e(branch.phone)}</p>${!isExempt ? `<p>VAT number ${e(branch.taxNumber)}</p>` : ""}<p>CR Number ${e(branch.commercialRegister)}</p></div><div class="logo-container">${branch.imageUrl ? `<img class="logo" src="${e(branch.imageUrl)}" alt=""/>` : ""}</div><div class="company-ar"><h2>${e(displayNames.ar)}</h2><p>${e(addressAr)}</p><p>${e(branch.email)}</p><p dir="ltr">${e(branch.phone)}</p>${!isExempt ? `<p>رقم التسجيل الضريبي ${e(branch.taxNumber)}</p>` : ""}<p>CR Number ${e(branch.commercialRegister)}</p></div></header>` : ""}
<h1>${e(docTitleEn)} <span dir="rtl">${e(input.docTitleAr)}</span></h1>
<table class="customer"><tbody>${infoRow(party.isSupplier ? "Supplier" : "Customer", party.isSupplier ? "المورد" : "العميل", party.name)}${infoRow("Address", "العنوان", customerAddress)}${infoRow("Phone", "الهاتف", party.phone)}${party.taxNo && party.taxNo !== "-" ? infoRow("VAT number", "رقم التسجيل الضريبي", party.taxNo) : ""}</tbody></table>
<div class="meta"><div class="meta-half"><div class="meta-line"><b>${e(input.invNoLabel[0])}</b><span>${e(input.invoiceNo)}</span><span class="ar">${e(input.invNoLabel[1])}</span></div></div><div class="meta-half"><div class="meta-line"><b>Date</b><span>${date(input.dateVal)}</span><span class="ar">التاريخ</span></div></div></div>
<table class="items"><colgroup><col style="width:12.4%"/>${!isExempt ? '<col style="width:12.6%"/><col style="width:17.2%"/>' : ""}<col style="width:11.8%"/><col style="width:8.2%"/><col style="width:${isExempt ? 64.7 : 34.9}%"/><col style="width:2.9%"/></colgroup><thead><tr><th><div dir="rtl">المجموع</div><span>Line amount</span></th>${!isExempt ? '<th><div dir="rtl">القيمة المضافة</div><span>VAT amount</span></th><th><div dir="rtl">المبلغ الخاضع للضريبة</div><span>Taxable amount</span></th>' : ""}<th><div dir="rtl">السعر</div><span>Price</span></th><th><div dir="rtl">الكمية</div><span>Qty</span></th><th style="text-align:right"><div dir="rtl">الوصف</div><span>Description</span></th><th>#</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="net">${money(r.netTotal)}</td>${!isExempt ? `<td>${money(r.taxAmt)}<div>${r.vatPct}%</div></td><td>${money(r.subTotal)}</td>` : ""}<td>${money(r.price)}</td><td>${r.qty}</td><td class="description"><span class="product-name">${e(r.name)}</span>${r.additionsText ? `<div class="sub">${e(r.additionsText)}</div>` : ""}${r.note ? `<div class="sub">${e(r.note)}</div>` : ""}</td><td>${i + 1}</td></tr>`).join("")}</tbody></table>
<div class="summary"><table class="totals"><colgroup><col style="width:19.375%"/><col style="width:16mm"/><col/></colgroup><tbody>${totalRow("Subtotal", "المجموع الفرعي", totals.taxable)}${totals.discount > 0 ? totalRow("Discount", "الخصم", totals.discount) : ""}${!isExempt ? totalRow("Total VAT", "إجمالي ضريبة القيمة المضافة", totals.vat) : ""}${totalRow("Total", isExempt ? "المجموع" : "المجموع شامل القيمة المضافة", totals.final)}${input.showPaidAndRemaining ? totalRow("Paid", "المدفوع", totals.paid) + totalRow("Remaining", "المتبقي", totals.remaining) : ""}${input.payments.map(p => totalRow(e(p.name), "نوع الدفع", p.amount)).join("")}</tbody></table>${qr ? `<div class="qr">${qr.src ? `<img src="${e(qr.src)}" alt="QR"/>` : ""}<div class="qr-caption"><div dir="rtl">تم ترميز هذا الرمز وفقاً لمتطلبات هيئة الزكاة والضريبة والجمارك للفوترة الإلكترونية</div><div>This QR code is encoded as per ZATCA e-invoicing requirements</div></div></div>` : ""}</div>
${stampImage || remarks ? `<section class="notes"><div>${stampImage ? `<img class="stamp" src="${e(stampImage)}" alt="الختم"/>` : ""}</div>${remarks ? `<div class="notes-text"><div class="notes-title">ملاحظات<br/>Notes</div><div class="remarks">${e(remarks)}</div></div>` : ""}</section>` : ""}
</main><footer class="footer"><div class="footer-company">${showHeaderAndFooterInPrint ? `${e(displayNames.en)}<br/><span dir="rtl">${e(displayNames.ar)}</span>` : ""}</div><div class="footer-page">Page 1 of 1 -</div><div class="footer-number">${e(input.invoiceNo)}</div></footer></div></body></html>`;
};
