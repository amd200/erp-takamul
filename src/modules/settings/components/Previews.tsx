import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import i18n from "@/shared/i18n"
import { renderDocument } from "@/shared/print"
import { invoiceA4Doc } from "@/modules/sales/print/invoiceA4Doc"
import type { PrintInvoice } from "@/modules/sales/print/printInvoice"
import type { Branch } from "@/modules/branches/types"
import type { Customer } from "@/modules/customers/types"
import { readScale, scaleRule } from "@/modules/pos/scale"
import type { Settings, SettingValue } from "../types"

type V = Record<string, SettingValue>
const n = (v: SettingValue, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : d)

/** How amounts will print with the chosen separators and decimals. */
/** A sales-screen tile at the chosen font sizes. */
export function AppearancePreview({ v }: { v: V }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg bg-muted p-4">
      <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground" style={{ fontSize: n(v.categorySize, 14) }}>{t("settings.sampleCategory")}</span>
      <div className="w-40 rounded-lg border bg-card p-3">
        <div className="font-semibold" style={{ fontSize: n(v.itemNameSize, 14) }}>{t("settings.sampleItem")}</div>
        <div className="text-muted-foreground" style={{ fontSize: n(v.itemPriceSize, 13) }}>35.00</div>
        <div className="mt-2 border-t pt-2" style={{ fontSize: n(v.subItemNameSize, 12) }}>{t("settings.sampleSub")} <span className="text-muted-foreground" style={{ fontSize: n(v.subItemPriceSize, 12) }}>+5.00</span></div>
      </div>
    </div>
  )
}

type Segment = "flag" | "code" | "value" | "ignored"
// Soft fills only: three quiet tones and no borders, so the digits stay easy to read.
const TONE: Record<Segment, string> = {
  flag: "bg-background text-muted-foreground",
  code: "bg-primary/10 text-primary",
  value: "bg-success-soft text-success",
  ignored: "text-muted-foreground/60",
}

/**
 * A scale simulator: type or scan a barcode and see which digits are the prefix, the item code and the weight
 * (or price), and what the sales screen would add. It follows the same rule as the sales screen.
 */
export function BarcodePreview({ v }: { v: V }) {
  const { t } = useTranslation()
  const [typed, setTyped] = useState<string | null>(null)
  const rule = scaleRule({ barcodeScale: v } as Settings)
  if (!rule) return null

  const sample = (() => {
    const digits = Array.from({ length: rule.length }, () => "0")
    const put = (at: number, text: string) => text.split("").forEach((ch, k) => { if (at + k < digits.length) digits[at + k] = ch })
    put(0, rule.flag)
    put(rule.codeStart, "12345678".slice(0, rule.codeLength).padEnd(rule.codeLength, "0"))
    put(rule.valueStart, (rule.type === "ByWeight" ? "1250" : "2575").padStart(rule.valueLength, "0").slice(-rule.valueLength))
    return digits.join("")
  })()
  const code = (typed ?? sample).trim()
  const result = readScale(code, rule)

  const segmentOf = (i: number): Segment =>
    i >= rule.valueStart && i < rule.valueStart + rule.valueLength ? "value"
      : i >= rule.codeStart && i < rule.codeStart + rule.codeLength ? "code"
        : i < rule.codeStart ? "flag" : "ignored"
  const overlap = rule.valueStart < rule.codeStart + rule.codeLength && rule.codeStart < rule.valueStart + rule.valueLength
  const outOfRange = Math.max(rule.codeStart + rule.codeLength, rule.valueStart + rule.valueLength) > rule.length

  // Why a barcode is not read as a scale label, in the order the sales screen checks.
  const reason =
    code.length !== rule.length ? t("settings.sim.errLength", { got: code.length, want: rule.length })
      : !/^\d+$/.test(code) ? t("settings.sim.errDigits")
        : code.slice(0, rule.codeStart) !== rule.flag ? t("settings.sim.errFlag", { got: code.slice(0, rule.codeStart), want: rule.flag })
          : t("settings.sim.errValue")

  const valueLabel = t(rule.type === "ByPrice" ? "settings.barcodePrice" : "settings.barcodeWeight")
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted px-4 py-4">
      <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {t("settings.sim.input")}
        <input dir="ltr" inputMode="numeric" value={typed ?? sample} onChange={(e) => setTyped(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 font-mono text-sm tracking-widest text-foreground" />
      </label>

      <div dir="ltr" className="flex flex-wrap gap-1 font-mono">
        {code.split("").map((ch, i) => (
          <span key={i} className={cn("flex h-8 w-6 items-center justify-center rounded-md text-sm", TONE[segmentOf(i)])}>{ch}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-muted-foreground/50" />{t("settings.barcodeFlag")}</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-primary" />{t("settings.barcodeCode")}</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-success" />{valueLabel}</span>
      </div>

      {(overlap || outOfRange) ? (
        <p className="text-sm text-warning">{t(overlap ? "settings.sim.warnOverlap" : "settings.sim.warnRange")}</p>
      ) : result ? (
        <p className="rounded-md bg-background px-3 py-2 text-sm">
          {rule.type === "ByWeight"
            ? t("settings.sim.meansWeight", { code: result.itemCode, qty: result.quantity })
            : t("settings.sim.meansPrice", { code: result.itemCode, price: result.price?.toFixed(2) })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("settings.sim.notScale")} {reason}</p>
      )}
    </div>
  )
}

const SAMPLE_INVOICE: PrintInvoice = {
  id: 0, number: "INV-000123", date: "2026-10-26T13:05:30", customerName: "شركة النور للتوريدات", warehouseName: "المخزن الرئيسي",
  employeeName: null, createdBy: "admin", paid: 120, notes: "",
  lines: [
    { productId: 1, unitId: 1, productName: "صنف تجريبي (1)", unitName: "حبة", quantity: 2, unitPrice: 50, taxPercentage: 15, taxCalculation: 2, discountKind: "value", discount: 0, amounts: { discount: 0, tax: 15, total: 115 } },
    { productId: 2, unitId: 1, productName: "صنف تجريبي (2)", unitName: "حبة", quantity: 1, unitPrice: 30, taxPercentage: 15, taxCalculation: 2, discountKind: "value", discount: 0, amounts: { discount: 0, tax: 4.5, total: 34.5 } },
  ],
  totals: { subTotal: 130, discount: 0, tax: 19.5, grandTotal: 149.5 },
  payments: [{ amount: 120, paymentMethod: "Cash" }],
}
const SAMPLE_BRANCH = { name: "مؤسسة المثال التجارية", nameEn: "Example Trading Est.", shortName: "المثال", shortNameEn: "Example", taxNumber: "300000000000003", commercialRegister: "1010000000", phone: "0500000000", cityName: "الرياض", district: "العليا", street: "شارع الملك فهد", postalCode: "12211", buildingNumber: "1234", subNumber: "5678", imageUrl: null, stampImageUrl: null, iban: "SA0000000000000000000000", footerNote: "", locationAddress: "" } as unknown as Branch
const SAMPLE_CUSTOMER = { phone: "0555555555", taxNumber: "300000000000009", commercialRegister: "1010111111", city: "الرياض", district: "النخيل", street: "طريق الملك عبدالله", postalCode: "12345", buildingNumber: "4321", additionalNumber: "8765", country: "السعودية" } as unknown as Customer

/** The A4 invoice as the chosen design prints it, on sample data, scaled to fit the card. */
export function A4Preview({ v }: { v: V }) {
  const { t } = useTranslation()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const design = String(v.a4InvoiceType ?? "Design1")

  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / 794)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const html = useMemo(() => renderDocument(invoiceA4Doc(SAMPLE_INVOICE, {
    branch: SAMPLE_BRANCH, customer: SAMPLE_CUSTOMER, isExempt: false, showPaymentMethods: true, showPaidAndRemaining: true,
    showBranchName: true, showHeaderAndFooter: v.showHeaderAndFooterInPrint !== false, blue: design === "Design2", design: design === "Design3" || design === "Design4" ? design : undefined, methodLabel: (m) => i18n.t(`sales.methods.${m}`),
  })), [v.showHeaderAndFooterInPrint, design])

  return (
    <div className="flex flex-col gap-2">
      <div ref={box} className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-white" style={{ height: 1123 * scale }}>
        <iframe title={t("settings.previewA4")} srcDoc={html} className="pointer-events-none absolute left-0 top-0 border-0 bg-white" style={{ width: 794, height: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }} />
      </div>
    </div>
  )
}
