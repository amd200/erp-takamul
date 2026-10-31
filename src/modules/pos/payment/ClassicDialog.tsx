import { Loader2, Printer, Save, Vault, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Keypad } from "./Keypad"
import { amountOf, usePayment, type PaymentProps } from "./usePayment"

/**
 * The first design: a header with the amount due, the treasury chips with a split switch, one keypad,
 * and the amount handed over next to the change. Split mode shows one card per treasury.
 */
export function ClassicDialog(props: PaymentProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, total, customerName, pending, onConfirm } = props
  const p = usePayment(props)
  const split = p.mode === "split"
  const diff = p.change
  const busy = pending

  const diffCard = (large?: boolean) => (
    <div className={cn("flex flex-col gap-0.5 rounded-xl border px-4 py-3", diff >= 0 ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10")}>
      <span className={cn("text-[11px] font-semibold", diff >= 0 ? "text-success" : "text-destructive")}>{diff >= 0 ? t("pos.change") : t("sales.remaining")}</span>
      <span className={cn("font-bold tabular-nums", large ? "text-xl" : "text-lg", diff >= 0 ? "text-success" : "text-destructive")}>{formatMoney(Math.abs(diff))}</span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex min-w-0 flex-col">
            <DialogTitle className="text-sm font-medium">{t("pos.payTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos.payHint")}</DialogDescription>
            {customerName && <span className="truncate text-[11px] opacity-70">{customerName}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] opacity-70">{t("pos.due")}</span>
              <span className="text-lg font-bold tabular-nums">{formatMoney(total)}</span>
            </div>
            <button type="button" aria-label={t("common.close")} disabled={busy} onClick={() => onOpenChange(false)} className="grid size-7 place-items-center rounded bg-white/15 hover:bg-white/25"><X className="size-3.5" /></button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">{split ? t("pos.splitBetween") : t("pos.destination")}</span>
              <button type="button" disabled={busy || p.treasuries.length < 2} onClick={p.toggleSplit}
                className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50", split ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/50 hover:text-primary")}>
                {split ? t("pos.splitOn") : t("pos.split")}
              </button>
            </div>
            {!split && (
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {p.treasuries.map((x) => {
                  const on = p.mode === "single" && p.singleId === x.id
                  return (
                    <button key={x.id} type="button" disabled={busy} onClick={() => p.selectSingle(x.id)}
                      className={cn("flex shrink-0 items-center gap-1 rounded-lg border-2 px-2.5 py-1.5 transition-colors", on ? "border-primary bg-primary/10" : "bg-card hover:border-border")}>
                      <Vault className={cn("size-3", on ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-bold whitespace-nowrap", on ? "text-primary" : "text-muted-foreground")}>{x.name}</span>
                    </button>
                  )
                })}
                <button type="button" disabled={busy} onClick={p.selectCredit}
                  className={cn("shrink-0 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors", p.credit ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:border-border")}>{t("pos.credit")}</button>
              </div>
            )}
          </div>

          {split && (
            <div className="flex flex-col gap-3">
              <div className={cn("grid gap-2", p.splits.length >= 3 ? "grid-cols-3" : p.splits.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
                {p.splits.map((s, i) => {
                  const on = p.activeId === s.id
                  return (
                    <div key={s.id} role="button" tabIndex={0} onClick={() => p.activate(s.id)} onKeyDown={(e) => e.key === "Enter" && p.activate(s.id)}
                      className={cn("flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-colors", on ? "border-primary bg-primary/5" : "bg-card hover:border-border")}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("truncate text-[11px] font-semibold", on ? "text-primary" : "text-muted-foreground")}>{p.treasuries.find((x) => x.id === s.treasuryId)?.name ?? `${t("sales.treasury")} ${i + 1}`}</span>
                        <span className={cn("size-2 shrink-0 rounded-full", on ? "bg-primary" : "bg-muted")} />
                      </div>
                      <div className={cn("rounded-lg px-2 py-2 text-center text-base font-bold tabular-nums", on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{formatMoney(amountOf(s.raw))}</div>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5 rounded-xl border bg-muted/50 px-4 py-3"><span className="text-[11px] font-semibold text-muted-foreground">{t("pos.totalEntered")}</span><span className="text-lg font-bold tabular-nums">{formatMoney(p.paid)}</span></div>
                {diffCard()}
              </div>
            </div>
          )}

          <Keypad onKey={p.pushKey} disabled={busy || p.credit} />

          {!split && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5 rounded-xl border bg-muted/50 px-4 py-3"><span className="text-[11px] font-semibold text-muted-foreground">{t("pos.tendered")}</span><span className="text-xl font-bold tabular-nums">{formatMoney(p.credit ? 0 : p.paid)}</span></div>
              {p.credit ? <div className="flex flex-col gap-0.5 rounded-xl border bg-warning/10 px-4 py-3"><span className="text-[11px] font-semibold text-warning">{t("pos.onAccount")}</span><span className="text-xl font-bold tabular-nums text-warning">{formatMoney(total)}</span></div> : diffCard(true)}
            </div>
          )}

          {p.credit && !p.hasCustomer && <p role="alert" className="text-sm text-destructive">{t("pos.creditNeedsCustomer")}</p>}
          {!p.credit && !p.canSave && p.paid > 0 && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
          <hr />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false)}><Save />{t("pos.saveOnly")}</Button>
            <Button type="button" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), true)}>{busy ? <Loader2 className="animate-spin" /> : <Printer />}{t("pos.confirm")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
