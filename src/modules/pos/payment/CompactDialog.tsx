import type { CSSProperties } from "react"
import { Banknote, CalendarDays, Check, CreditCard, Delete, FileClock, FileText, Landmark, Vault, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/modules/settings"
import { amountOf, usePayment, type PaymentProps } from "./usePayment"

// Scoped to this dialog so the salon theme gives it the theme colours; otherwise the fallbacks below apply.
const beautyStyle = {
  "--compact-payment-border": "var(--border)", "--compact-payment-accent": "var(--primary)", "--compact-payment-selected": "var(--secondary)",
  "--compact-payment-ink": "var(--foreground)", "--compact-payment-muted": "var(--muted-foreground)", "--compact-payment-icon": "var(--muted-foreground)",
  "--compact-payment-check-border": "var(--border)", "--compact-payment-amount-muted": "var(--muted-foreground)", "--compact-payment-background": "var(--background)",
  "--compact-payment-surface": "var(--card)", "--compact-payment-accent-hover": "var(--primary)", "--compact-payment-header": "var(--primary)",
  "--compact-payment-header-muted": "var(--primary-foreground)", "--compact-payment-header-amount": "var(--primary-foreground)", "--compact-payment-accent-border": "var(--border)",
  "--compact-payment-accent-soft": "var(--secondary)", "--compact-payment-ink-hover": "var(--primary)", "--compact-payment-ink-soft": "var(--secondary)", "--compact-payment-action": "var(--primary)",
} as CSSProperties

const treasuryClass = "group h-auto min-h-[58px] w-full justify-start gap-1.5 rounded-[15px] border border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-surface,#fff)]/40 p-2 text-start whitespace-normal text-[var(--compact-payment-muted,#626b8a)] hover:bg-[var(--compact-payment-surface,#fff)] disabled:opacity-45 data-[selected=true]:border-[var(--compact-payment-accent,#199f50)] data-[selected=true]:bg-[var(--compact-payment-selected,#e6f6ec)] data-[selected=true]:text-[var(--compact-payment-ink,#0e124d)] sm:min-h-[72px] sm:gap-3 sm:px-4 sm:py-3 [&>svg]:text-[var(--compact-payment-icon,#9ba2b6)] data-[selected=true]:[&>svg]:text-[var(--compact-payment-accent,#199f50)]"
const checkClass = "flex size-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--compact-payment-check-border,#ccd1e0)] sm:size-[22px] group-data-[selected=true]:border-[var(--compact-payment-accent,#199f50)] group-data-[selected=true]:bg-[var(--compact-payment-accent,#199f50)]"
const nameClass = "min-w-0 flex-1 truncate text-xs font-semibold sm:text-base"
const amountClass = "shrink-0 whitespace-nowrap font-[Arial] text-sm font-semibold text-[var(--compact-payment-amount-muted,#9098af)] sm:text-lg group-data-[selected=true]:font-bold group-data-[selected=true]:text-[var(--compact-payment-accent,#199f50)]"
const allocationClass = "group flex min-h-16 min-w-0 items-center gap-3 rounded-[15px] border border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-surface,#fff)] px-4 py-2 text-[var(--compact-payment-muted,#626b8a)] only:col-span-full data-[active=true]:border-[var(--compact-payment-accent,#199f50)] data-[active=true]:text-[var(--compact-payment-accent,#199f50)]"
const inputClass = "min-w-0 w-full flex-1 border-0 bg-transparent p-0 text-left font-[Arial] text-[26px] font-bold text-[var(--compact-payment-muted,#626b8a)] outline-none group-data-[active=true]:text-[var(--compact-payment-ink,#0e124d)]"
const keyClass = "min-h-[54px] rounded-[15px] border border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-surface,#fff)] font-[Arial] text-[25px] font-medium text-[var(--compact-payment-ink,#0e124d)] transition-colors hover:border-[var(--compact-payment-accent-border,#a8dec0)] hover:bg-[var(--compact-payment-accent-soft,#eff7f2)] active:bg-[var(--compact-payment-selected,#e6f6ec)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--compact-payment-accent,#199f50)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[clamp(40px,calc((100dvh-382px)/4),66px)]"
const actionClass = "h-12 gap-2 rounded-[14px] text-[13px] font-bold sm:h-[54px] sm:text-[15px]"
const KEYS = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], [".", "0", "back"]]

function iconOf(name: string, id: number) {
  if (/بنك|بنكي|تحويل|bank|transfer/i.test(name)) return Landmark
  if (/قسط|أقساط|اقساط|installment/i.test(name)) return CalendarDays
  if (id === 1 || /شبكة|بطاقة|card|mada/i.test(name)) return CreditCard
  if (id === 2 || /كاش|نقد|cash/i.test(name)) return Banknote
  return Vault
}

/** The third design, as in the old POS: treasuries down one side, totals, amount fields and keypad on the other, actions in a bar below. */
export function CompactDialog(props: PaymentProps) {
  const { t } = useTranslation()
  const { open, onOpenChange, total, pending, onConfirm } = props
  const p = usePayment(props)
  const settings = useAppSettings()
  const showPdf = !props.requestCheckout && !props.purchase && settings.operationsTab?.allowPrintA3 === true
  const beauty = settings.salonsTab?.beautyTheme === true
  const busy = pending
  const split = p.mode === "split"
  const difference = -p.change

  const rows = split ? p.splits.map((s) => ({ key: s.id, treasuryId: s.treasuryId, raw: s.raw })) : p.mode === "single" ? [{ key: 0, treasuryId: p.singleId, raw: p.singleRaw }] : []
  const choose = (id: number) => (split ? p.toggleSplitTreasury(id) : p.selectSingle(id))

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} style={beauty ? beautyStyle : undefined}
        className="flex max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-background,#f7f8fc)] p-0 text-[var(--compact-payment-ink,#0e124d)] shadow-2xl ring-0 sm:max-h-[calc(100dvh-24px)] sm:w-[calc(100vw-24px)] sm:max-w-[900px] sm:rounded-[20px]">
        <header className="flex min-h-[67px] shrink-0 items-center justify-between bg-[var(--compact-payment-header,#0e124d)] px-4 py-3 text-white sm:py-2 sm:ps-[30px] sm:pe-11">
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-8">
            <DialogTitle className="text-[21px] leading-[1.4] font-extrabold text-white! sm:text-[27px]">{t("posPayment.title")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos.payHint")}</DialogDescription>
            <Button type="button" size="sm" aria-pressed={split} disabled={busy || p.treasuries.length < 2} onClick={p.toggleSplit}
              className={cn("h-8 rounded-full bg-[var(--compact-payment-accent,#199f50)] px-3.5 text-xs font-bold text-white hover:bg-[var(--compact-payment-accent-hover,#168c46)] aria-[pressed=false]:bg-white/10 aria-[pressed=false]:ring-1 aria-[pressed=false]:ring-white/25 sm:min-w-[156px] sm:px-[22px] sm:text-[15px]", beauty && "bg-white/20 hover:bg-white/30")}>
              {t("posPayment.split")}
            </Button>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-start">
              <span className="text-[13px] leading-[1.4] text-[var(--compact-payment-header-muted,#b9bfd8)]">{t("posPayment.due")}</span>
              <strong className="font-[Arial] text-[28px] leading-none font-extrabold text-[var(--compact-payment-header-amount,#45dc82)] sm:text-[30px]" dir="ltr">{total.toFixed(2)}</strong>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={t("common.close")} disabled={busy} onClick={() => onOpenChange(false)} className="relative -left-6 size-8 shrink-0 rounded-lg bg-white/15 text-white hover:bg-white/25 hover:text-white"><X size={18} /></Button>
          </div>
        </header>

        <div className="grid h-[640px] min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden px-3 pt-2 pb-4 sm:h-[470px] sm:grid-cols-[300px_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)] sm:gap-6 sm:ps-6 sm:pe-2 sm:pt-1 sm:pb-5">
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden" aria-label={t("posPayment.destination")}>
            <p className="m-0 min-h-[25px] shrink-0 text-xs leading-[25px] text-[var(--compact-payment-muted,#626b8a)]">{split ? t("posPayment.chooseTwo") : t("posPayment.destination")}</p>
            <div className="grid min-h-0 min-w-0 flex-1 grid-cols-2 content-start gap-2 overflow-x-hidden overflow-y-auto overscroll-contain p-1 [scrollbar-gutter:stable] sm:flex sm:flex-col sm:gap-2.5 [&>button]:min-w-0 [&>button]:shrink-0">
              {p.treasuries.map((x) => {
                const raw = rows.find((r) => r.treasuryId === x.id)?.raw
                const selected = raw !== undefined
                const Icon = iconOf(x.name, x.id)
                return (
                  <Button key={x.id} type="button" variant="ghost" className={treasuryClass} data-selected={selected} aria-pressed={selected} disabled={busy} onClick={() => choose(x.id)}>
                    <span className={checkClass}>{selected && <Check size={14} strokeWidth={3} className="text-white" />}</span>
                    <Icon size={19} aria-hidden="true" />
                    <span className={nameClass} title={x.name}>{x.name}</span>
                    <span className={amountClass} dir="ltr">{amountOf(raw ?? "0").toFixed(2)}</span>
                  </Button>
                )
              })}
            </div>
            {p.loading && <p role="status" className="mt-2.5 shrink-0 text-xs text-[var(--compact-payment-muted,#626b8a)]">{t("common.loading")}</p>}
            {!p.loading && p.treasuries.length === 0 && <p role="alert" className="mt-2.5 shrink-0 text-xs text-[#c83232]">{p.error ? t("pos.treasuryError") : t("pos.noTreasury")}</p>}
            <div className="shrink-0 p-1 pt-2">
              <Button type="button" variant="ghost" className={treasuryClass} data-selected={p.credit} aria-pressed={p.credit} disabled={busy} onClick={p.selectCredit}>
                <span className={checkClass}>{p.credit && <Check size={14} strokeWidth={3} className="text-white" />}</span>
                <FileClock size={19} aria-hidden="true" />
                <span className={nameClass}>{t("posPayment.credit")}</span>
                <span className={amountClass} dir="ltr">{total.toFixed(2)}</span>
              </Button>
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-2 sm:pt-[18px]" aria-label={t("posPayment.tendered")}>
            <div className="grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
              <div className="flex min-h-14 flex-col justify-center rounded-[14px] border border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-surface,#fff)] px-4 py-0.5">
                <span className="text-[11px] leading-normal text-[var(--compact-payment-muted,#626b8a)]">{t("posPayment.totalEntered")}</span>
                <strong className="self-start font-[Arial] text-[26px] leading-[1.15] font-bold" dir="ltr">{p.paid.toFixed(2)}</strong>
              </div>
              <div className={cn("flex min-h-14 flex-col justify-center rounded-[14px] border px-4 py-0.5", difference > 0 ? "border-[#f0b8b8] bg-[#fcecec] text-[#c83232]" : "border-[var(--compact-payment-accent-border,#a8dec0)] bg-[var(--compact-payment-selected,#e6f6ec)] text-[var(--compact-payment-accent,#199f50)]")}>
                <span className="text-[11px] leading-normal">{difference >= 0 ? t("posPayment.remaining") : t("posPayment.change")}</span>
                <strong className="self-start font-[Arial] text-[26px] leading-[1.15] font-bold" dir="ltr">{Math.abs(difference).toFixed(2)}</strong>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rows.map((r) => {
                const name = p.treasuries.find((x) => x.id === r.treasuryId)?.name
                return (
                  <label key={r.key} className={allocationClass} data-active={!split || p.activeId === r.key}>
                    <span className="max-w-[45%] min-w-0 truncate text-xs" title={name}>{name}</span>
                    <input className={inputClass} aria-label={name} type="text" inputMode="decimal" dir="ltr" value={r.raw} disabled={busy}
                      onFocus={(e) => { if (split) p.activate(r.key); e.currentTarget.select() }}
                      onChange={(e) => (split ? p.setSplitRaw(r.key, e.target.value) : p.setSingleRaw(e.target.value))} />
                  </label>
                )
              })}
            </div>
            <div className="mt-1 flex flex-col gap-2" aria-label={t("posPayment.keypad")} dir="ltr">
              {KEYS.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  {row.map((k) => (
                    <button key={k} type="button" disabled={busy || p.credit || (split && !p.splits.length)} aria-label={k === "back" ? t("posPayment.deleteDigit") : k}
                      onMouseDown={(e) => e.preventDefault()} onClick={() => p.pushKey(k)} className={keyClass}>
                      {k === "back" ? <Delete size={22} className="mx-auto text-[#d33232]" /> : k}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {props.requestCheckout && !p.canSave && p.paid > 0 && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
          </section>
        </div>

        <footer className={cn("grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--compact-payment-border,#e1e4ec)] bg-[var(--compact-payment-surface,#fff)] p-3 sm:gap-3 sm:ps-6 sm:pe-2 sm:py-3.5", ["sm:grid-cols-[2fr_1fr]", "sm:grid-cols-[2fr_1fr_1fr]", "sm:grid-cols-[2fr_1fr_1fr_1fr]"][Number(showPdf) + Number(split)])}>
          <Button type="button" className={`${actionClass} col-span-full border-[var(--compact-payment-action,#0e124d)] bg-[var(--compact-payment-action,#0e124d)] text-white hover:bg-[var(--compact-payment-ink-hover,#191e65)] sm:col-span-1`} disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), true)}>{t("posPayment.saveAndPrint")}</Button>
          <Button type="button" variant="outline" className={cn(actionClass, "border-[var(--compact-payment-accent,#199f50)] bg-[var(--compact-payment-surface,#fff)] text-[var(--compact-payment-accent,#199f50)] hover:bg-[var(--compact-payment-accent-soft,#eff7f2)] hover:text-[var(--compact-payment-accent,#199f50)]", !showPdf && !split && "col-span-full sm:col-span-1")} disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false)}>{t("posPayment.saveOnly")}</Button>
          {showPdf && <Button type="button" variant="outline" className={cn(actionClass, "border-[var(--compact-payment-ink,#0e124d)] bg-[var(--compact-payment-surface,#fff)] text-[var(--compact-payment-ink,#0e124d)] hover:bg-[var(--compact-payment-ink-soft,#f0f1f8)] hover:text-[var(--compact-payment-ink,#0e124d)]")} disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false, "pdf")}><FileText size={17} />{t("posPayment.savePdf")}</Button>}
          {split && <Button type="button" variant="outline" className={cn(actionClass, "border-[#ce3030] bg-[var(--compact-payment-surface,#fff)] text-[#ce3030] hover:bg-[#fff3f3] hover:text-[#ce3030]", showPdf && "col-span-full sm:col-span-1")} disabled={busy} onClick={p.toggleSplit}>{t("posPayment.stopSplit")}</Button>}
        </footer>
      </DialogContent>
    </Dialog>
  )
}
