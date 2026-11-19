import { Eraser, History, Ruler } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { filledCount, useTailoringStore } from "../store"
import { BODY_MEASURES, DETAIL_MEASURES, MEASURE_KEYS, type MeasureKey, type Measurements } from "../types"

/** The measurement boxes in cm (body, then details), numbered so the tailor can match them on the paper ticket. */
export function MeasureFields({ value, onChange }: { value: Measurements; onChange: (k: MeasureKey, v: string) => void }) {
  const { t } = useTranslation()
  const field = (k: MeasureKey) => (
    <label key={k} className="flex items-center gap-2 rounded-lg border bg-card p-2 ps-3 transition focus-within:border-primary">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary tabular-nums">{MEASURE_KEYS.indexOf(k) + 1}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(`tailoring.measures.${k}`)}</span>
      <div dir="ltr" className="relative w-24 shrink-0">
        <Input value={value[k]} onChange={(e) => onChange(k, e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" aria-label={t(`tailoring.measures.${k}`)}
          className="h-9 pe-8 text-center font-semibold tabular-nums" />
        <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-[11px] text-faint">{t("tailoring.measures.unit")}</span>
      </div>
    </label>
  )
  const group = (title: string, keys: readonly MeasureKey[]) => (
    <section>
      <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">{keys.map(field)}</div>
    </section>
  )
  return (
    <div className="space-y-4">
      {group(t("tailoring.measures.body"), BODY_MEASURES)}
      {group(t("tailoring.measures.details"), DETAIL_MEASURES)}
    </div>
  )
}

/**
 * The order customer's measurements in a window (opened from the cart): loaded from what is saved on the customer, and
 * saved back on them with the order.
 */
export function MeasurementsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const customer = useTailoringStore((s) => s.customer)
  const measurements = useTailoringStore((s) => s.measurements)
  const setMeasure = useTailoringStore((s) => s.setMeasure)
  const reset = useTailoringStore((s) => s.resetMeasurements)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-4 pt-4 pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold"><Ruler className="size-4.5 text-primary" />{t("tailoring.measures.title")}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary tabular-nums">{t("tailoring.measures.filled", { n: filledCount(measurements), total: MEASURE_KEYS.length })}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("tailoring.measures.title")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto bg-muted/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {customer
              ? <p className="min-w-0 flex-1 text-xs text-primary">{t("tailoring.measures.savedHint", { name: customer.name })}</p>
              : <p className="min-w-0 flex-1 text-xs text-warning">{t("tailoring.measures.noCustomer")}</p>}
            <Button type="button" variant="outline" size="sm" disabled={!customer} onClick={() => reset("saved")} className="border-primary text-primary hover:bg-primary/10 hover:text-primary"><History />{t("tailoring.measures.fromSaved")}</Button>
            <Button type="button" variant="ghost-destructive" size="sm" onClick={() => reset("empty")}><Eraser />{t("tailoring.measures.clear")}</Button>
          </div>
          <MeasureFields value={measurements} onChange={setMeasure} />
        </div>
        <div className="border-t px-3 pt-3 pb-4">
          <Button type="button" className="h-12 w-full gap-2 px-5 text-base" onClick={() => onOpenChange(false)}>{t("pos1.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
