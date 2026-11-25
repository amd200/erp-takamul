import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const shown = (n: number, decimals = 4) => String(Number(n.toFixed(decimals)))

/**
 * A number field the user can clear while typing: the value only changes on a valid number, and the
 * field shows the real value again when it loses focus.
 */
export function NumberInput({ value, onChange, positive, decimals, className, label, disabled, invalid }: {
  value: number
  onChange: (n: number) => void
  /** Zero is refused (quantities). */
  positive?: boolean
  decimals?: number
  className?: string
  label: string
  disabled?: boolean
  invalid?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input type="text" inputMode="decimal" dir="ltr" aria-label={label} aria-invalid={invalid || undefined} disabled={disabled}
      value={draft ?? shown(value, decimals)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        const v = e.target.value
        if (!/^\d*\.?\d*$/.test(v) || (decimals != null && (v.split(".")[1]?.length ?? 0) > decimals)) return
        setDraft(v)
        const n = parseFloat(v)
        if (Number.isFinite(n) && (positive ? n > 0 : n >= 0)) onChange(n)
      }}
      className={cn("h-9 min-w-0 rounded-lg border border-input bg-background px-2 text-center text-sm font-semibold tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50 aria-invalid:border-destructive", className)} />
  )
}

/** Minus, the quantity, plus. The buttons never go below one; typing allows fractions (weights). */
export function QtyStepper({ value, onChange, className }: { value: number; onChange: (n: number) => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <div dir="ltr" className={cn("flex h-9 items-center overflow-hidden rounded-lg border border-input bg-background", className)}>
      <button type="button" aria-label={t("pos.less")} onClick={() => onChange(Math.max(1, Math.ceil(value) - 1))} className="grid h-full w-8 shrink-0 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground"><Minus className="size-3.5" /></button>
      <NumberInput value={value} onChange={onChange} positive label={t("products.quantity")} className="h-full w-full rounded-none border-0 border-x focus-visible:ring-0" />
      <button type="button" aria-label={t("pos.more")} onClick={() => onChange(Math.floor(value) + 1)} className="grid h-full w-8 shrink-0 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="size-3.5" /></button>
    </div>
  )
}
