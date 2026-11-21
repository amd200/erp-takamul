import { Banknote, CalendarCheck, CalendarClock, CreditCard, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { CurrencySymbol } from "@/modules/settings"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { orderTotals, useTailoringStore } from "../store"
import type { PayMethod } from "../types"

/**
 * Opens on "pay" in the cart: the fitting and delivery dates, an urgent order, and the deposit taken now (half, full or
 * any amount, cash or card) with what is left to pay on delivery. `onConfirm` runs the checks and saves the order.
 */
export function PayDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }) {
  const { t } = useTranslation()
  const s = useTailoringStore()
  const { total } = orderTotals(s.pieces, s.lines)
  const remaining = total - Math.min(Number(s.deposit) || 0, total)
  const today = new Date().toISOString().slice(0, 10)
  const chip = "h-10 border-primary px-3 text-primary hover:bg-primary/10 hover:text-primary"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-4 pt-4 pb-3">
          <DialogTitle className="text-sm font-semibold">{t("tailoring.payTitle")}</DialogTitle>
          <DialogDescription className="sr-only">{t("tailoring.payTitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("pos1.payable")}</span>
            <span className="flex items-center gap-1 text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(total)}<CurrencySymbol size={16} /></span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />{t("tailoring.dates.fitting")}</span>
              <DatePicker clearable min={today} value={s.fitting} onChange={(v) => s.set({ fitting: v })} />
            </label>
            <label className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarCheck className="size-3.5" />{t("tailoring.dates.delivery")}{s.pieces.length > 0 && <span className="text-destructive">*</span>}</span>
              <DatePicker min={s.fitting || today} value={s.delivery} onChange={(v) => s.set({ delivery: v })} />
            </label>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold"><Zap className={cn("size-4", s.urgent ? "text-warning" : "text-gray-400")} />{t("tailoring.dates.urgent")}</span>
            <Switch checked={s.urgent} onCheckedChange={(v) => s.set({ urgent: v })} />
          </label>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t("tailoring.totals.deposit")}</span>
            <div className="flex items-center gap-1.5">
              <Input value={s.deposit} onChange={(e) => s.set({ deposit: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" dir="ltr" placeholder="0.00"
                aria-label={t("tailoring.totals.deposit")} className="h-10 min-w-0 flex-1 bg-background text-center text-base font-semibold tabular-nums" />
              <Button type="button" variant="outline" disabled={!total} onClick={() => s.set({ deposit: (total / 2).toFixed(2) })} className={chip}>{t("tailoring.totals.half")}</Button>
              <Button type="button" variant="outline" disabled={!total} onClick={() => s.set({ deposit: total.toFixed(2) })} className={chip}>{t("tailoring.totals.full")}</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "card"] as PayMethod[]).map((m) => (
              <button key={m} type="button" aria-pressed={s.method === m} onClick={() => s.set({ method: m })}
                className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all", s.method === m ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-400 dark:border-border dark:bg-background")}>
                {m === "cash" ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}{t(`tailoring.totals.${m}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-black">
            <span>{t("tailoring.totals.remaining")}</span>
            <span className={cn("flex items-center gap-1 text-lg tabular-nums", remaining > 0 ? "text-destructive" : "text-success")}>{formatMoney(remaining)}<CurrencySymbol size={13} /></span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t px-3 pt-3 pb-4">
          <Button type="button" variant="outline" className="h-12 flex-1 gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={onConfirm}>{t("tailoring.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
