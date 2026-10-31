import { useState } from "react"
import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import type { CartDiscount } from "../types"

const box = "h-9 w-20 rounded-lg border border-input bg-background px-1 text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"

/** A discount on the whole invoice, as a percentage or an amount. Once applied it shows as a chip that removes it. */
export function InvoiceDiscount({ discount, onChange, disabled, fieldsAlways }: { discount: CartDiscount; onChange: (d: CartDiscount) => void; disabled?: boolean; /** Keep the fields beside the chip (purchases 2 shows both). */ fieldsAlways?: boolean }) {
  const { t } = useTranslation()
  const [pct, setPct] = useState("")
  const [flat, setFlat] = useState("")
  const applied = discount.value > 0

  const apply = () => {
    const p = parseFloat(pct)
    const f = parseFloat(flat)
    if (Number.isFinite(p) && p > 0) onChange({ kind: "percent", value: Math.min(p, 100) })
    else if (Number.isFinite(f) && f > 0) onChange({ kind: "value", value: f })
    setPct(""); setFlat("")
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{t("pos2.invoiceDiscount")}</span>
        {applied && (
          <button type="button" disabled={disabled} onClick={() => onChange({ kind: "value", value: 0 })} aria-label={t("pos2.removeDiscount")}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-destructive-soft ps-3 pe-1 text-xs font-semibold text-destructive hover:opacity-80">
            {discount.kind === "percent" ? `${discount.value}%` : formatMoney(discount.value)}
            <span className="grid size-5 place-items-center rounded-full bg-destructive/15"><X className="size-3" /></span>
          </button>
        )}
      </div>
      {(!applied || fieldsAlways) && (
        <div className="flex items-end gap-2">
          <label className="flex flex-col items-center gap-0.5 text-[11px] text-muted-foreground">%
            <input inputMode="decimal" dir="ltr" value={pct} disabled={disabled || !!flat} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setPct(e.target.value)} className={box} />
          </label>
          <label className="flex flex-col items-center gap-0.5 text-[11px] text-muted-foreground">{t("sales.kindValue")}
            <input inputMode="decimal" dir="ltr" value={flat} disabled={disabled || !!pct} onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setFlat(e.target.value)} className={box} />
          </label>
          <Button type="button" size="sm" className="h-9 rounded-full bg-brand-green px-4 text-white hover:bg-brand-green/90" disabled={disabled || (!pct && !flat)} onClick={apply}>{t("pos2.apply")}</Button>
        </div>
      )}
    </div>
  )
}
