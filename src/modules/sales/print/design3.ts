import { tafqeet } from "@/lib/tafqeet";
import { cityToEnglish, districtToEnglish, streetToEnglish } from "@/lib/arabicToEnglish";
interface BranchNames {
  name?: string | null;
  nameEn?: string | null;
  shortName?: string | null;
  shortNameEn?: string | null;
}

/** A4 titles use either the full names or the short names, never both. */
export function getA4BranchDisplayNames(branch: BranchNames, showBranchName: boolean) {
  return showBranchName
    ? { ar: branch.name || "-", en: branch.nameEn || "-" }
    : { ar: branch.shortName?.trim() || "", en: branch.shortNameEn?.trim() || "" };
}

export interface Design3Row {
  name: string;
  additionsText: string;
  note: string;
  price: number;
  qty: number;
  subTotal: number;
  discount: number;
  vatPct: number;
  taxAmt: number;
  netTotal: number;
}

export interface Design3Input {
  t: any;
  branch: Record<string, any>;
  docTitleAr: string;
  docTitleEn: string;
  invNoLabel: [string, string];
  invoiceNo: string;
  dateVal?: any;
  formattedTime: string;
  remarks: string;
  party: {
    isSupplier: boolean;
    name: string;
    phone: string;
    taxNo: string;
    commercial: string;
    city: string;
    district: string;
    street: string;
    building: string;
    subNo: string;
    postal: string;
  };
  rows: Design3Row[];
  isExempt: boolean;
  showHeaderAndFooterInPrint: boolean;
  /** Branch-name print settings; defaults to full name only. */
  branchNames?: BranchNameOptions;
  totals: { taxable: number; discount: number; vat: number; final: number; paid: number; remaining: number };
  showPaidAndRemaining: boolean;
  payments: { name: string; amount: number }[];
  /** null hides the QR box; `src: null` shows the "unavailable" placeholder. */
  qr: { src: string | null } | null;
}

export interface BranchNameOptions {
  showBranchName: boolean;
}

/** Shared "tax invoice" A4 layout (setting: Design3) used by the invoice and the generic documents. */
export const renderDesign3A4 = (input: Design3Input): string => {
  const { t, branch, docTitleAr, docTitleEn, invNoLabel, invoiceNo, dateVal, formattedTime, remarks, party, rows, isExempt, showHeaderAndFooterInPrint, showPaidAndRemaining, payments, qr } = input;
  const branchNames: BranchNameOptions = input.branchNames ?? { showBranchName: true };
  const displayNames = getA4BranchDisplayNames(branch, branchNames.showBranchName);
  const { name: custName, phone: custPhone, taxNo: custTaxNo, commercial: custCommercial, building: custBuilding, subNo: custSubNo, postal: custPostal, city, district, street } = party;
  const totBeforeVAT = input.totals.taxable;
  const discount = input.totals.discount;
  const totalVAT = input.totals.vat;
  const finalTotal = input.totals.final;
  const total = input.totals.paid;
  const remaining = input.totals.remaining;
  const iban = String(branch.iban || "").trim();
  const stampImage = String(branch.stampImageUrl || "").trim();

  const parsedDate = dateVal ? new Date(dateVal) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
  const mdy = validDate ? `${String(validDate.getMonth() + 1).padStart(2, "0")}-${String(validDate.getDate()).padStart(2, "0")}-${validDate.getFullYear()}` : "-";
  // "SO-so1-000063" → "63": the trailing number without leading zeros
  const trailingDigits = String(invoiceNo).match(/(\d+)\D*$/)?.[1];
  const shortInvoiceNo = trailingDigits ? String(Number(trailingDigits)) : invoiceNo;
  const s2 = (n: number) => n.toFixed(2);

  const d3Rows = rows.map((r, idx) => `<tr>
        <td class="c">${idx + 1}</td>
        <td class="desc">${r.name}${r.additionsText ? `<div class="sub">الإضافات : ${r.additionsText}</div>` : ""}${r.note ? `<div class="sub">(${r.note})</div>` : ""}</td>
        <td class="c">${s2(r.price)}</td>
        <td class="c">${r.qty}</td>
        ${!isExempt ? `<td class="c">${s2(r.subTotal)}</td>` : ""}
        <td class="c">${s2(r.discount)}</td>
        ${!isExempt ? `<td class="c">${r.vatPct}</td><td class="c">${s2(r.taxAmt)}</td>` : ""}
        <td class="c b">${s2(r.netTotal)}</td>
      </tr>`).join("");

  const bankName = String(branch.bankName || "").trim();
  const bankNameEn = String(branch.bankNameEn || "").trim() || bankName;
  const bankAccName = String(branch.bankAccountName || "").trim();
  const bankAccNameEn = String(branch.bankAccountNameEn || "").trim() || bankAccName;
  const bankAccNo = String(branch.bankAccountNumber || "").trim();
  const bankRow = (en: string, ar: string, arV: string, enV: string = arV) =>
    `<tr><td class="en l">${en}</td><td class="en v">${enV}</td><td class="ar">${arV}</td><td class="ar" style="white-space:nowrap">${ar}</td></tr>`;
  const th = (ar: string, en: string, w?: string) => `<th${w ? ` style="width:${w}"` : ""}>${en}<span>${ar}</span></th>`;
  const totalRow = (en: string, ar: string, val: string, strong = false) => `<tr${strong ? ' class="strong"' : ""}><td class="tlabel">${en} - ${ar}</td><td class="tv">${val}</td></tr>`;
  const biRow = (en1: string, ar1: string, v1: string | [string, string], en2?: string, ar2?: string, v2?: string | [string, string]) => {
    const pair = (v: string | [string, string]) => (Array.isArray(v) ? v : [v, v]);
    const [a1, e1] = pair(v1);
    const [a2, e2] = v2 === undefined ? ["", ""] : pair(v2);
    return en2
      ? `<tr><td class="il en">${en1}</td><td class="iv en">${e1}</td><td class="il en">${en2}</td><td class="iv en">${e2}</td><td class="iv ar">${a2}</td><td class="il ar">${ar2}</td><td class="iv ar">${a1}</td><td class="il ar">${ar1}</td></tr>`
      : `<tr><td class="il en">${en1}</td><td class="iv en" colspan="3">${e1}</td><td class="iv ar" colspan="3">${a1}</td><td class="il ar">${ar1}</td></tr>`;
  };

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&display=swap" rel="stylesheet" crossorigin="anonymous"/>
<style>
  @page { size: A4 portrait; margin: 10mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Alexandria', Arial, sans-serif; font-weight: 500; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: #fff; color: #111; font-size: 10px; line-height: 1.4; padding: 10mm 12mm; }
  .header-grid { display: grid; grid-template-columns: 2fr 1fr 2fr; gap: 12px; margin-bottom: 5px; }
  .header-col { display: flex; flex-direction: column; justify-content: space-between; gap: 6px; align-self: stretch; min-width: 0; }
  .company-title { flex: 1; font-size: 11px; font-weight: 700; text-align: center; padding: 6px 10px 11px; color: #000; background: #f2f2f2; border-radius: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; word-spacing: 5px; }
  .meta-row { flex: 1; display: flex; width: 100%; align-items: stretch; gap: 4px; }
  .meta-label-ar { width: 75px; flex: 0 0 75px; font-size: 9px; padding: 6px 5px 11px; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; text-align: center; color: #000; font-weight: 700; white-space: nowrap; }
  .meta-value { flex: 1; font-size: 10px; padding: 6px 10px 11px; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #000; white-space: nowrap; font-weight: 700; overflow: hidden; }
  .meta-label-en { width: 60px; flex: 0 0 60px; font-size: 7px; padding: 6px 5px 11px; color: #000; background: #f2f2f2; border-radius: 3px; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 600; white-space: nowrap; }
  .logo-container { flex-direction:column; gap:4px; border-radius: 3px; display: flex; align-items: center; justify-content: center; min-height: 90px; background: #f2f2f2; align-self: stretch; min-width: 0; }

  .doc-title { display: flex; align-items: center; justify-content: center; gap: 16px; font-size: 18px; font-weight: 700; margin: 12px 0 8px; padding-bottom: 6px; border-bottom: 1.5px solid #000; direction: ltr; }
  table { width: 100%; border-collapse: collapse; }
  .meta-tbl { direction: ltr; table-layout: fixed; margin-bottom: 8px; border: 1.5px solid #000; }
  .meta-tbl th { background: #d9dee6; border: 1px solid #000; padding: 4px 6px; font-size: 9px; font-weight: 600; text-align: center; }
  .meta-tbl th span { display: block; font-size: 8px; color: #444; }
  .meta-tbl td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px; font-weight: 600; }
  .party-title { background: #d9dee6; border: 1.5px solid #000; border-bottom: none; text-align: center; font-weight: 700; font-size: 10.5px; padding: 3px; }
  .info-tbl { margin-bottom: 8px; border: 1.5px solid #000; table-layout: fixed; direction: ltr; }
  .info-tbl td { border: 1px solid #000; padding: 4px 4px; font-size: 9px; white-space: nowrap; vertical-align: middle; font-weight: 500; }
  .info-tbl .il { text-align: right; white-space: nowrap; }
  .info-tbl .iv { overflow: hidden; }
  .info-tbl .en.iv { text-align: center; direction: ltr; }
  .info-tbl .en.il { text-align: right; direction: ltr; }
  .info-tbl .ar { text-align: right; direction: rtl; }
  .info-tbl .ar.iv { text-align: center; }
  .items-tbl { direction: ltr; table-layout: fixed; border: 1.5px solid #000; margin-bottom: 0; }
  .items-tbl th { background: #d9dee6; border: 1px solid #000; padding: 5px 4px; font-size: 9px; font-weight: 700; text-align: center; vertical-align: middle; }
  .items-tbl th span { display: block; font-size: 8px; font-weight: 500; color: #444; }
  .items-tbl td { border: 1px solid #000; padding: 6px 5px; font-size: 9.5px; vertical-align: middle; }
  .items-tbl .c { text-align: center; }
  .items-tbl .b { font-weight: 700; }
  .items-tbl .desc { text-align: center; unicode-bidi: plaintext; font-weight: 600; }
  .items-tbl .sub { font-size: 8px; color: #555; font-weight: 500; }
  .items-tbl tr { break-inside: avoid; page-break-inside: avoid; }
  .totals-tbl { direction: ltr; border: 1.5px solid #000; border-top: none; break-inside: avoid; page-break-inside: avoid; }
  .totals-tbl td { border: 1px solid #000; padding: 4px 8px; font-size: 10.5px; font-weight: 700; }
  .totals-tbl .tlabel { text-align: center; }
  .totals-tbl .tv { width: 14%; text-align: center; }
  .words { border: 1.5px solid #000; border-top: none; text-align: center; font-weight: 700; font-size: 11px; padding: 5px; }
  .bottom { display: flex; gap: 6px; margin-top: 12px; align-items: stretch; direction: ltr; break-inside: avoid; page-break-inside: avoid; }
  .bottom-main { flex: 1; min-width: 0; }
  .bank-tbl { table-layout: fixed; border: 1.5px solid #000; }
  .bank-tbl th { background: #d9dee6; border: 1px solid #000; padding: 3px; font-size: 10px; font-weight: 500; text-align: center; }
  .bank-tbl td { border: 1px solid #000; padding: 3px 6px; font-size: 9.5px; height: 18px; font-weight: 500; }
  .bank-tbl .en.l { text-align: right; }
  .bank-tbl .en.v { text-align: left; direction: ltr; }
  .bank-tbl .ar { text-align: right; direction: rtl; }
  .sig { position: relative; margin-top: 4px; }
  .sig-tbl { table-layout: fixed; border: 1.5px solid #000; }
  .sig-tbl th { background: #d9dee6; border: 1px solid #000; padding: 3px; font-size: 10px; font-weight: 500; text-align: center; }
  .sig-tbl td { border: 1px solid #000; height: 62px; }
  .sig .stamp { position: absolute; left: 15%; width: 30%; top: -4px; bottom: -4px; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .sig .stamp img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .qr-box { width: 118px; border: 1.5px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; gap: 4px; }
  .qr-box img { width: 100%; aspect-ratio: 1; object-fit: contain; }
  .qr-box div { font-size: 8px; font-weight: 700; }
  .notes-box { background: #fafafa; padding: 8px 12px; border: 1.5px solid #000; margin-top: 10px; font-size: 11px; text-align: center; break-inside: avoid; }
  @media print { body { padding: 0; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
</style>
</head>
<body>
<!-- ══ HEADER (same as the standard A4 header) ══ -->
${showHeaderAndFooterInPrint ? `<div class="header-grid">
  <div class="header-col">
    <div class="company-title">${displayNames.ar.replace(/ /g, "&nbsp;")}</div>
    <div class="meta-row">
      <div class="meta-label-ar">${t("vat_number", "الرقم&nbsp;الضريبي")}</div>
      <div class="meta-value">${branch.taxNumber || "-"}</div>
      <div class="meta-label-en">VAT No.</div>
    </div>
  </div>
  <div class="logo-container">
    ${branch?.imageUrl ? `<img src="${branch.imageUrl}" alt="Logo" style="max-height:85px;max-width:100%;object-fit:contain;" onerror="this.style.display='none'"/>` : `<div style="font-size:14px;font-weight:700;">Logo / اللوجو</div>`}
  </div>
  <div class="header-col">
    <div class="company-title">${displayNames.en.replace(/ /g, "&nbsp;")}</div>
    <div class="meta-row">
      <div class="meta-label-ar">${t("commercial_register", "سجل التجاري")}</div>
      <div class="meta-value">${branch.commercialRegister || "-"}</div>
      <div class="meta-label-en">Commercial No.</div>
    </div>
  </div>
</div>` : ""}

<div class="doc-title"><span>${docTitleEn}</span><span style="direction:rtl">${docTitleAr}</span></div>

<!-- ══ INVOICE META ══ -->
<table class="meta-tbl">
  <thead><tr>
    <th>${invNoLabel[0]}<span>${invNoLabel[1]}</span></th>
    <th>Invoice Date<span>تاريخ الإصدار</span></th>
    <th>Time<span>الوقت</span></th>
    <th style="width:50%">Invoice Remarks<span>ملحوظات الفاتورة</span></th>
  </tr></thead>
  <tbody><tr>
    <td>${shortInvoiceNo}</td><td>${mdy}</td><td>${formattedTime}</td>
    <td>${remarks}</td>
  </tr></tbody>
</table>

<!-- ══ SELLER ══ -->
<div class="party-title">Seller Details - بيانات البائع</div>
<table class="info-tbl">
  <colgroup><col style="width:9%"><col style="width:11%"><col style="width:13%"><col style="width:18%"><col style="width:17%"><col style="width:11%"><col style="width:11%"><col style="width:10%"></colgroup>
  ${biRow("Name", "الاسم", [branch.name || "-", branch.nameEn || branch.name || "-"])}
  ${biRow("Street Name", "اسم الشارع", [branch.street || branch.address || "-", streetToEnglish(branch.street || branch.address)])}
  ${biRow("Bldg. No.", "رقم المبنى", branch.buildingNumber || "-", "City", "المدينة", [branch.cityName || "-", cityToEnglish(branch.cityName)])}
  ${biRow("Add. No.", "الرقم الإضافي", branch.subNumber || branch.additionalNumber || "-", "District", "الحي", [branch.district || "-", districtToEnglish(branch.district)])}
  ${biRow("Postal Code", "الرمز البريدي", branch.postalCode || "-", "VAT Number", "الرقم الضريبي", branch.taxNumber || "-")}
  ${biRow("Phone", "رقم الجوال", branch.phone || "-", "Commercial Reg.", "السجل التجاري", branch.commercialRegister || "-")}
</table>

<!-- ══ CUSTOMER ══ -->
<div class="party-title">${party.isSupplier ? "Supplier Details - بيانات المورد" : "Buyer Details - بيانات المشتري"}</div>
<table class="info-tbl">
  <colgroup><col style="width:9%"><col style="width:11%"><col style="width:13%"><col style="width:18%"><col style="width:17%"><col style="width:11%"><col style="width:11%"><col style="width:10%"></colgroup>
  ${biRow("Name", "الاسم", custName)}
  ${biRow("Street Name", "اسم الشارع", [street || "-", streetToEnglish(street)])}
  ${biRow("Bldg. No.", "رقم المبنى", custBuilding, "City", "المدينة", [city || "-", cityToEnglish(city)])}
  ${biRow("Add. No.", "الرقم الإضافي", custSubNo, "District", "الحي", [district || "-", districtToEnglish(district)])}
  ${biRow("Postal Code", "الرمز البريدي", custPostal, "VAT Number", "الرقم الضريبي", custTaxNo)}
  ${biRow("Phone", "رقم الجوال", custPhone, "Commercial Reg.", "السجل التجاري", custCommercial)}
</table>

<!-- ══ ITEMS ══ -->
<table class="items-tbl">
  <thead><tr>
    ${th("م", "#", "5%")}
    ${th("الوصف", "Description", isExempt ? "48%" : "26%")}
    ${th("سعر الوحدة", "U. Price", "10%")}
    ${th("الكمية", "Qty", "7%")}
    ${!isExempt ? th("الخاضع للضريبة", "Taxable Amount", "12%") : ""}
    ${th("الخصم", "Discount", "9%")}
    ${!isExempt ? th("الضريبة %", "VAT%", "7%") + th("مبلغ الضريبة", "VAT Amount", "10%") : ""}
    ${th("الإجمالي", "T. Amount", "12%")}
  </tr></thead>
  <tbody>${d3Rows}</tbody>
</table>

<!-- ══ TOTALS ══ -->
<table class="totals-tbl">
  ${!isExempt ? totalRow("Taxable Amount", "المبلغ الخاضع للضريبة", s2(totBeforeVAT)) : ""}
  ${totalRow("Discount", "مجموع الخصومات", s2(discount))}
  ${!isExempt ? totalRow("Total Taxable Amount (Excluding VAT)", "الإجمالي الخاضع للضريبة (غير شامل ضريبة القيمة المضافة)", s2(totBeforeVAT - discount)) : ""}
  ${!isExempt ? totalRow("Total VAT", "مجموع قيمة الضريبة المضافة", s2(totalVAT)) : ""}
  ${totalRow("Total Amount Due", "إجمالي المبلغ المستحق", s2(finalTotal), true)}
  ${showPaidAndRemaining ? totalRow("Paid Amount", "المدفوع", s2(total)) + totalRow("Remaining", "المتبقي", s2(remaining)) : ""}
  ${payments.map((p) => totalRow("Payment Type", `نوع الدفع (${p.name})`, s2(p.amount))).join("")}
</table>
<div class="words">${tafqeet(finalTotal, "en")}</div>

<!-- ══ BANK / SIGNATURES / QR ══ -->
<div class="bottom">
  <div class="bottom-main">
    <table class="bank-tbl">
      <colgroup><col style="width:14%"><col style="width:33%"><col style="width:33%"><col style="width:20%"></colgroup>
      <thead><tr><th colspan="2">Bank Details</th><th colspan="2">تفاصيل الحساب المصرفي</th></tr></thead>
      <tbody>
        ${bankRow("A/C Name", "اسم الحساب", bankAccName, bankAccNameEn)}
        ${bankRow("Bank Name", "اسم البنك", bankName, bankNameEn)}
        ${bankRow("A/C Number", "رقم الحساب البنكي", bankAccNo)}
        ${bankRow("IBAN", "رقم الايبان", iban)}
      </tbody>
    </table>
    <div class="sig">
      <table class="sig-tbl">
        <thead><tr><th>Prepared By ( أعدت بواسطة )</th><th>Checked By ( فحص بواسطة )</th><th>Received By ( استلمت من قبل )</th></tr></thead>
        <tbody><tr><td></td><td></td><td></td></tr></tbody>
      </table>
      ${stampImage ? `<div class="stamp"><img src="${stampImage}" alt="الختم"/></div>` : ""}
    </div>
  </div>
  ${qr ? `<div class="qr-box">${qr.src ? `<img src="${qr.src}" alt="QR"/>` : `<div style="font-weight:500;color:#555">QR Code Unavailable</div>`}<div>${invoiceNo}</div></div>` : ""}
</div>

${branch.footerNote ? `<div class="notes-box">${branch.footerNote}</div>` : ""}
</body>
</html>`;
};
