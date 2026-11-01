import { FileText, Loader2, Printer, Save, Vault, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/modules/settings"
import { Keypad } from "./Keypad"
import { amountOf, usePayment, type PaymentProps } from "./usePayment"

/**
 * The first design, as in the old POS: a navy header with the amount due, the treasury chips with a split switch,
 * one keypad, and the amount handed over next to the change. Split mode shows one card per treasury (up to three).
 * There is no credit choice here: a sale on the customer's account is made from the other two designs.
 */
export function ClassicDialog(props: PaymentProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, total, customerName, showCustomer = true, pending, onConfirm } = props
  const p = usePayment(props, false)
  const showPdf = !props.requestCheckout && !props.purchase
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const split = p.mode === "split"
  const diff = p.change
  const busy = pending

  const diffCard = (large?: boolean) => (
    <div className={cn("flex flex-col gap-0.5 rounded-xl border px-4 py-3", diff >= 0 ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10")}>
      <span className={cn("text-[10px] font-semibold", diff >= 0 ? "text-success" : "text-destructive")}>{diff >= 0 ? t("posPayment.change") : t("posPayment.remaining")}</span>
      <span className={cn("font-black tabular-nums", large ? "text-xl" : "text-lg", diff >= 0 ? "text-success" : "text-destructive")}>{Math.abs(diff).toFixed(2)}</span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* White on the navy bar; the dialog title would otherwise take the page's dark text colour. */}
        <div className={cn("flex items-center justify-between px-4 py-3", beauty ? "bg-primary text-primary-foreground" : "bg-brand-navy text-white dark:bg-slate-800")}>
          <div className="flex min-w-0 flex-col">
            <DialogTitle className="text-[14px] font-medium text-inherit!">{t("posPayment.title")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos.payHint")}</DialogDescription>
            {showCustomer && customerName && <span className="mt-0.5 truncate text-[11px] opacity-80">{customerName}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] opacity-70">{t("posPayment.due")}</span>
              <span className={cn("text-[18px] font-black tabular-nums", beauty ? "text-primary-foreground" : "text-green-400")}>{total.toFixed(2)}</span>
            </div>
            <button type="button" aria-label={t("common.close")} disabled={busy} onClick={() => onOpenChange(false)} className="grid size-7 place-items-center rounded bg-white/15 transition-colors hover:bg-white/25"><X className="size-3.5" /></button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">{split ? t("posPayment.splitBetween") : t("posPayment.destination")}</span>
              <button type="button" disabled={busy} onClick={() => (split ? p.stopSplit() : p.startSplit(undefined, true))}
                className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors", split ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/50 hover:text-primary")}>
                {split ? t("posPayment.splitOn") : t("posPayment.split")}
              </button>
            </div>
            {!split && (
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {p.treasuries.map((x) => {
                  const on = p.singleId === x.id
                  return (
                    <button key={x.id} type="button" disabled={busy} onClick={() => p.selectSingle(x.id)}
                      className={cn("flex shrink-0 items-center gap-1 rounded-lg border-2 px-2.5 py-1.5 transition-all", on ? "border-primary bg-primary/10" : "bg-card hover:border-border/80")}>
                      <Vault className={cn("size-2.5", on ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-xs font-bold whitespace-nowrap", on ? "text-primary" : "text-muted-foreground")}>{x.name}</span>
                    </button>
                  )
                })}
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
                      className={cn("flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all", on ? "border-primary bg-primary/5" : "bg-card hover:border-border/80")}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("truncate text-[10px] font-semibold", on ? "text-primary" : "text-muted-foreground")}>{p.treasuries.find((x) => x.id === s.treasuryId)?.name ?? `${t("posPayment.vault")} ${i + 1}`}</span>
                        <span className={cn("size-2 shrink-0 rounded-full", on ? "bg-primary" : "bg-muted")} />
                      </div>
                      <div className={cn("rounded-lg px-2 py-2 text-center text-base font-black tracking-tight tabular-nums", on ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{amountOf(s.raw).toFixed(2)}</div>
                    </div>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5 rounded-xl border bg-muted/50 px-4 py-3"><span className="text-[10px] font-semibold text-muted-foreground">{t("posPayment.totalEntered")}</span><span className="text-lg font-black tabular-nums">{p.paid.toFixed(2)}</span></div>
                {diffCard()}
              </div>
            </div>
          )}

          <Keypad onKey={p.pushKey} disabled={busy} />

          {!split && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5 rounded-xl border bg-muted/50 px-4 py-3"><span className="text-[10px] font-semibold text-muted-foreground">{t("posPayment.tendered")}</span><span className="text-xl font-black tabular-nums">{p.paid.toFixed(2)}</span></div>
              {diffCard(true)}
            </div>
          )}

          {props.requestCheckout && !p.canSave && p.paid > 0 && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
          <hr />
          <div className="grid grid-cols-2 gap-2">
            {showPdf && <Button type="button" variant="outline" size="sm" className="col-span-2 h-10 gap-1.5 text-[12px]" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false, "pdf")}><FileText className="size-[13px]" />{t("posPayment.printPdf")}</Button>}
            <Button type="button" variant="outline" size="sm" className="col-span-2 h-10 gap-1.5 text-[12px]" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false)}><Save className="size-[13px]" />{t("posPayment.saveOnly")}</Button>
            <Button type="button" size="sm" className={cn("col-span-2 h-10 gap-1.5 text-[12px]", beauty ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-primary dark:hover:bg-primary/90")} disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), true)}>
              {busy ? <Loader2 className="size-[13px] animate-spin" /> : <Printer className="size-[13px]" />}{t("posPayment.saveAndPrint")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
