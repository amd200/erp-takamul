import { Banknote, Calculator, CreditCard, FileClock, Loader2, Printer, Save, Vault, WalletCards, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENCY, useAppSettings } from "@/modules/settings"
import { cn } from "@/lib/utils"
import { usePayment, type PaymentProps } from "./usePayment"

// As in the current POS, treasury 1 is the network (card) one and treasury 2 the cash one; the others go by their names.
const iconOf = (id: number) => (id === 1 ? CreditCard : id === 2 ? Banknote : Vault)

/**
 * The second design: a row per payment method, each a button with the amount field beside it. The first two
 * treasuries are the main methods, the rest sit in a list, and "cash + network" splits between the two main ones.
 */
export function MethodsDialog(props: PaymentProps) {
  const { t } = useTranslation()
  const currency = CURRENCY
  const { open, onOpenChange, pending, onConfirm } = props
  const p = usePayment(props)
  const busy = pending
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const primary = [1, 2].flatMap((id) => p.treasuries.filter((x) => x.id === id))
  const extra = p.treasuries.filter((x) => x.id !== 1 && x.id !== 2)
  const label = (x: { id: number; name: string }) => (x.id === 1 ? t("pos1.network") : x.id === 2 ? t("pos1.cash") : x.name)
  const navy = beauty ? "border-primary bg-primary text-primary-foreground shadow-md" : "border-[#263e72] bg-[#263e72] text-white shadow-md"
  const line = beauty ? "border-primary" : "border-[#263e72]"
  const split = p.mode === "split"
  const extraSelected = p.mode === "single" && extra.some((x) => x.id === p.singleId)

  const pill = (on: boolean) => cn(
    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-1.5 text-[13px] font-extrabold transition-all disabled:opacity-50",
    on ? navy : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40",
  )
  const field = (active: boolean) => cn("h-full min-h-14 w-full rounded-xl border bg-background px-4 pe-12 text-left text-lg font-black outline-none transition focus:ring-2", line, active && (beauty ? "focus:ring-primary/15" : "focus:ring-[#263e72]/15"))
  const unit = <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} onPointerDownOutside={(e) => e.preventDefault()} className="flex max-h-[94dvh] w-[calc(100%-2rem)] max-w-sm flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-background p-0 text-foreground sm:max-w-sm">
        <header className="flex items-center gap-2.5 border-b border-border px-6 py-4 sm:px-8">
          <Calculator size={23} strokeWidth={2.5} className={beauty ? "text-primary" : "text-[#263e72]"} />
          <DialogTitle className="text-lg font-bold sm:text-xl">{t("pos1.payTotal")}</DialogTitle>
          <DialogDescription className="sr-only">{t("pos.payHint")}</DialogDescription>
          <button type="button" aria-label={t("common.close")} title={t("common.close")} disabled={busy} onClick={() => onOpenChange(false)} className="ms-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </header>

        <main className="max-h-[68vh] min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-4 sm:px-7">
          {extra.length > 0 && (
            <section className="border-b border-border pb-3.5">
              <Select disabled={busy} value={extraSelected ? String(p.singleId) : ""} onValueChange={(v) => p.selectSingle(Number(v))}>
                <SelectTrigger className={cn("h-14 w-full rounded-xl border-2 bg-card px-3 text-right text-sm font-bold transition-colors hover:border-primary/40", extraSelected ? (beauty ? "border-primary text-primary" : "border-[#263e72] text-[#263e72]") : "border-border text-foreground")}>
                  <Vault size={18} className={beauty ? "text-primary" : "text-[#263e72]"} /><SelectValue placeholder={t("pos1.selectVault")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border p-1.5 shadow-lg">{extra.map((x) => <SelectItem key={x.id} value={String(x.id)} className="rounded-lg py-2.5 text-sm font-semibold">{label(x)}</SelectItem>)}</SelectContent>
              </Select>
            </section>
          )}

          <section className="space-y-3">
            {primary.map((x) => {
              const Icon = iconOf(x.id)
              const on = p.mode === "single" && p.singleId === x.id
              return (
                <div key={x.id} className="grid grid-cols-2 gap-3">
                  <button type="button" disabled={busy} onClick={() => p.selectSingle(x.id)} className={pill(on)}><Icon size={21} strokeWidth={2} /><span className="line-clamp-2">{label(x)}</span></button>
                  <div className="relative min-w-0" dir="ltr">
                    <input type="number" min="0" step="0.01" inputMode="decimal" value={on ? p.singleRaw : "0.00"} readOnly={!on} disabled={busy} aria-label={`${t("pos.tendered")} - ${label(x)}`}
                      onFocus={(e) => { if (!on) p.selectSingle(x.id); e.currentTarget.select() }} onChange={(e) => p.setSingleRaw(e.target.value)} className={field(on)} />
                    {unit}
                  </div>
                </div>
              )
            })}

            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={busy} onClick={p.selectCredit} className={pill(p.credit)}><FileClock size={21} strokeWidth={2} /><span>{t("pos.credit")}</span></button>
              <div className="relative min-w-0" dir="ltr">
                <input type="text" value="0.00" disabled aria-label={`${t("pos.tendered")} - ${t("pos.credit")}`} className={cn("h-full min-h-14 w-full cursor-not-allowed rounded-xl border bg-muted/40 px-4 pe-12 text-left text-lg font-black opacity-100 outline-none", line)} />
                {unit}
              </div>
            </div>

            {primary.length === 2 && (
              <button type="button" disabled={busy} onClick={() => (split ? p.stopSplit() : p.startSplit(primary.map((x) => x.id)))}
                className={cn(pill(split), "min-h-20 w-full gap-1.5 py-3 text-sm")}><WalletCards size={25} strokeWidth={2} /><span>{t("pos1.cash")} + {t("pos1.network")}</span></button>
            )}

            {primary.length === 2 && (
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                {primary.map((x) => {
                  const sp = p.splits.find((y) => y.treasuryId === x.id)
                  const active = split && !!sp && p.activeId === sp.id
                  return (
                    <label key={x.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-border bg-muted/35 p-2">
                      <span className="px-1 text-sm font-bold text-muted-foreground">{label(x)}</span>
                      <input type="number" min="0" step="0.01" inputMode="decimal" dir="ltr" value={split && sp ? sp.raw : "0.00"} disabled={!split || !sp || busy} aria-label={`${t("pos.tendered")} - ${label(x)}`}
                        onFocus={(e) => { if (sp) p.activate(sp.id); e.currentTarget.select() }} onChange={(e) => sp && p.setSplitRaw(sp.id, e.target.value)}
                        className={cn("h-12 min-w-0 rounded-lg border bg-background px-3 text-left text-lg font-black outline-none transition disabled:cursor-default disabled:opacity-100", line, active && (beauty ? "ring-2 ring-primary/10" : "ring-2 ring-[#263e72]/10"))} />
                    </label>
                  )
                })}
              </div>
            )}
          </section>
          {p.credit && !p.hasCustomer && <p role="alert" className="text-sm text-destructive">{t("pos.creditNeedsCustomer")}</p>}
          {!p.credit && !p.canSave && p.paid > 0 && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
        </main>

        <DialogFooter className="mx-0 mb-0 grid shrink-0 grid-cols-2 gap-3 rounded-none border-t border-border bg-muted/20 px-5 py-3 max-sm:static sm:grid sm:grid-cols-2 sm:flex-none sm:px-7">
          <Button type="button" variant="outline" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), false)}
            className={cn("h-12 gap-2 px-5 text-sm font-semibold", beauty ? "border-primary text-primary hover:bg-primary/10 hover:text-primary" : "border-[#263e72] text-[#263e72] hover:bg-[#263e72]/5 hover:text-[#263e72]")}><Save size={17} />{t("pos.saveOnly")}</Button>
          <Button type="button" disabled={busy || !p.canSave} onClick={() => onConfirm(p.payments(), true)}
            className={cn("h-12 gap-2 px-5 text-sm font-semibold", beauty ? "bg-primary text-primary-foreground hover:bg-primary/85" : "bg-[#263e72] text-white hover:bg-[#1e315d]")}>{busy ? <Loader2 className="animate-spin" /> : <Printer size={17} />}{t("pos1.saveAndPrint")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
