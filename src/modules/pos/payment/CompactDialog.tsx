import { Banknote, CalendarDays, Check, CreditCard, FileClock, Landmark, Loader2, Printer, Save, Vault, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Keypad } from "./Keypad"
import { amountOf, usePayment, type PaymentProps } from "./usePayment"

function iconOf(name: string) {
  if (/بنك|تحويل|bank|transfer/i.test(name)) return Landmark
  if (/قسط|installment/i.test(name)) return CalendarDays
  if (/شبكة|بطاقة|card|mada/i.test(name)) return CreditCard
  if (/نقد|كاش|cash/i.test(name)) return Banknote
  return Vault
}

/**
 * The third design, wide: treasuries down one side (a tick and the amount each), the totals, the amount fields and
 * the keypad on the other, a bar of actions at the bottom. Splitting picks two treasuries.
 */
export function CompactDialog(props: PaymentProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, total, pending, onConfirm } = props
  const p = usePayment(props)
  const busy = pending
  const split = p.mode === "split"
  const diff = p.change

  const rows = split ? p.splits.map((s) => ({ key: s.id, treasuryId: s.treasuryId, raw: s.raw })) : p.mode === "single" ? [{ key: 0, treasuryId: p.singleId, raw: p.singleRaw }] : []
  const amountFor = (treasuryId: number) => rows.find((r) => r.treasuryId === treasuryId)?.raw

  const choose = (id: number) => (split ? p.toggleSplitTreasury(id) : p.selectSingle(id))
  const tile = "group flex min-h-14 w-full items-center justify-start gap-3 rounded-2xl border bg-card/40 px-4 py-2 text-start whitespace-normal transition-colors hover:bg-card disabled:opacity-50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground"
  const tick = "grid size-5 shrink-0 place-items-center rounded-full border group-data-[selected=true]:border-primary group-data-[selected=true]:bg-primary"

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[56rem]">
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 bg-primary px-5 py-3 text-primary-foreground">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1">
            <DialogTitle className="text-xl font-extrabold">{t("pos.payTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos.payHint")}</DialogDescription>
            <Button type="button" size="sm" aria-pressed={split} disabled={busy || p.treasuries.length < 2} onClick={p.toggleSplit}
              className={cn("h-8 rounded-full px-4 text-xs font-bold", split ? "bg-white text-primary hover:bg-white/90" : "bg-white/10 text-primary-foreground ring-1 ring-white/30 hover:bg-white/20")}>{t("pos.splitPayment")}</Button>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-75">{t("pos.due")}</span>
              <strong className="text-2xl leading-none font-extrabold tabular-nums">{formatMoney(total)}</strong>
            </div>
            <button type="button" aria-label={t("common.close")} disabled={busy} onClick={() => onOpenChange(false)} className="grid size-8 place-items-center rounded-lg bg-white/15 hover:bg-white/25"><X className="size-[18px]" /></button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-[17rem_minmax(0,1fr)] sm:gap-6 sm:p-5">
          <section aria-label={t("pos.destination")} className="flex min-w-0 flex-col gap-2">
            <p className="text-xs text-muted-foreground">{split ? t("pos.chooseTwo") : t("pos.destination")}</p>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto overscroll-contain p-0.5 sm:flex sm:flex-col [&>button]:shrink-0">
              {p.treasuries.map((x) => {
                const raw = amountFor(x.id)
                const selected = raw !== undefined
                const Icon = iconOf(x.name)
                return (
                  <Button key={x.id} type="button" variant="ghost" data-selected={selected} aria-pressed={selected} disabled={busy} className={tile} onClick={() => choose(x.id)}>
                    <span className={tick}>{selected && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}</span>
                    <Icon className="size-5 shrink-0 text-muted-foreground group-data-[selected=true]:text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={x.name}>{x.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums group-data-[selected=true]:font-bold group-data-[selected=true]:text-primary" dir="ltr">{formatMoney(amountOf(raw ?? "0"))}</span>
                  </Button>
                )
              })}
            </div>
            {p.loading && <p role="status" className="text-xs text-muted-foreground">{t("common.loading")}</p>}
            {!p.loading && p.treasuries.length === 0 && <p role="alert" className="text-xs text-destructive">{p.error ? t("pos.treasuryError") : t("pos.noTreasury")}</p>}
            <Button type="button" variant="ghost" data-selected={p.credit} aria-pressed={p.credit} disabled={busy} className={cn(tile, "mt-auto shrink-0")} onClick={p.selectCredit}>
              <span className={tick}>{p.credit && <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />}</span>
              <FileClock className="size-5 shrink-0 text-muted-foreground group-data-[selected=true]:text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t("pos.credit")}</span>
              <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums group-data-[selected=true]:font-bold group-data-[selected=true]:text-primary" dir="ltr">{formatMoney(total)}</span>
            </Button>
          </section>

          <section aria-label={t("pos.tendered")} className="flex min-w-0 flex-col gap-3">
            <div className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
              <div className="flex min-h-16 flex-col justify-center rounded-2xl border bg-card px-4"><span className="text-xs text-muted-foreground">{t("pos.totalEntered")}</span><strong className="text-2xl font-bold tabular-nums" dir="ltr">{formatMoney(p.credit ? 0 : p.paid)}</strong></div>
              <div className={cn("flex min-h-16 flex-col justify-center rounded-2xl border px-4", !p.credit && diff < 0 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success")}>
                <span className="text-xs">{p.credit ? t("pos.onAccount") : diff < 0 ? t("sales.remaining") : t("pos.change")}</span>
                <strong className="text-2xl font-bold tabular-nums" dir="ltr">{formatMoney(p.credit ? total : Math.abs(diff))}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {rows.map((r) => {
                const x = p.treasuries.find((y) => y.id === r.treasuryId)
                const active = split ? p.activeId === r.key : true
                return (
                  <label key={r.key} data-active={active} className="group flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border bg-card px-4 py-2 text-muted-foreground only:col-span-full data-[active=true]:border-primary">
                    <span className="max-w-[45%] min-w-0 truncate text-xs" title={x?.name}>{x?.name}</span>
                    <input type="text" inputMode="decimal" dir="ltr" aria-label={x?.name} value={r.raw} disabled={busy}
                      onFocus={(e) => { if (split) p.activate(r.key); e.currentTarget.select() }}
                      onChange={(e) => (split ? p.setSplitRaw(r.key, e.target.value) : p.setSingleRaw(e.target.value))}
                      className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-start text-2xl font-bold tabular-nums text-foreground outline-none" />
                  </label>
                )
              })}
            </div>

            <Keypad onKey={p.pushKey} disabled={busy || p.credit || p.mode === "split" && !p.splits.length} keyClass="h-12 rounded-xl" />
            {p.credit && !p.hasCustomer && <p role="alert" className="text-sm text-destructive">{t("pos.creditNeedsCustomer")}</p>}
            {!p.credit && !p.canSave && p.paid > 0 && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
          </section>
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t bg-card p-3 sm:grid-cols-[2fr_1fr] sm:gap-3 sm:px-5">
          <Button type="button" size="lg" className="col-span-full h-12 sm:col-span-1" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), true)}>{busy ? <Loader2 className="animate-spin" /> : <Printer />}{t("pos.saveAndPrint")}</Button>
          <Button type="button" variant="outline" size="lg" className="col-span-full h-12 sm:col-span-1" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false)}><Save />{t("pos.saveOnly")}</Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
