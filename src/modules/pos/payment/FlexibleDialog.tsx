import { useEffect, useMemo, useState } from "react"
import { Delete, Loader2, Plus, Printer, Save, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { PAYMENT_METHODS, type PaymentMethod } from "@/modules/sales/types"
import type { PaymentProps } from "./usePayment"

type Row = { id: number; treasuryId: number; method: PaymentMethod; raw: string }

const round = (n: number) => Math.round(n * 100) / 100
const amountOf = (raw: string) => { const v = parseFloat(raw); return Number.isFinite(v) ? v : 0 }
let rowSeq = 0

/** Digits only, one decimal point, two decimals at most. */
function typeKey(raw: string, key: string, fresh: boolean) {
  if (key === "back") return raw.length > 1 ? raw.slice(0, -1) : "0"
  const base = fresh ? "0" : raw
  if (key === ".") return base.includes(".") ? base : `${base}.`
  const next = base === "0" ? key : base + key
  return /^\d{0,9}(\.\d{0,2})?$/.test(next) ? next : base
}

/**
 * The flexible design: collects the payment for the sale. One row per payment (a treasury, a method and an amount) so a bill can be split;
 * the keypad types into the selected row. Cash handed over beyond the total is change, not a payment.
 */
export function FlexibleDialog({ open, onOpenChange, total, hasCustomer, pending, onConfirm, purchase }: PaymentProps) {
  const { t } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const sales = useAppSettings().sales ?? {}
  const defaultVault = purchase ? sales.defaultPurchasesVault : sales.defaultSalesVault
  const [rows, setRows] = useState<Row[]>([])
  const [active, setActive] = useState(0)
  const [fresh, setFresh] = useState(true)

  useEffect(() => {
    if (!open) return
    setRows([{ id: rowSeq++, treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, method: "Cash", raw: total.toFixed(2) }])
    setActive(0); setFresh(true)
  }, [open, total, treasuries, defaultVault])

  const paid = round(rows.reduce((s, r) => s + amountOf(r.raw), 0))
  const remaining = round(Math.max(0, total - paid))
  const over = round(Math.max(0, paid - total))
  const cashPaid = rows.filter((r) => r.method === "Cash").reduce((s, r) => s + amountOf(r.raw), 0)
  // Only cash can be given back; any other overpayment is a mistake.
  const change = Math.min(over, round(cashPaid))
  const badOver = over - change > 0.005
  const unpaidOk = remaining <= 0.005 || hasCustomer
  const noTreasury = rows.some((r) => amountOf(r.raw) > 0 && !r.treasuryId)
  const canConfirm = !pending && rows.some((r) => amountOf(r.raw) > 0) && !badOver && unpaidOk && !noTreasury || (!pending && total === 0)

  const patch = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const press = (key: string) => { patch(active, { raw: typeKey(rows[active]?.raw ?? "0", key, fresh) }); setFresh(false) }
  const select = (i: number) => { setActive(i); setFresh(true) }
  const fillRest = (i: number) => { const others = rows.reduce((s, r, j) => (j === i ? s : s + amountOf(r.raw)), 0); patch(i, { raw: round(Math.max(0, total - others)).toFixed(2) }); setFresh(true) }
  const add = () => { setRows((rs) => [...rs, { id: rowSeq++, treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, method: "CreditCard", raw: "0" }]); setActive(rows.length); setFresh(true) }
  const remove = (i: number) => { setRows((rs) => rs.filter((_, j) => j !== i)); setActive(0); setFresh(true) }

  const quick = useMemo(() => {
    const due = round(total)
    return [...new Set([due, Math.ceil(due / 10) * 10, Math.ceil(due / 50) * 50, Math.ceil(due / 100) * 100].filter((v) => v >= due))].slice(0, 4)
  }, [total])

  const confirm = (print: boolean) => {
    // Cash given beyond the total comes back as change, so the cash rows are trimmed to what is owed.
    let toTrim = change
    const payments = [...rows].reverse().map((r) => {
      let amount = amountOf(r.raw)
      if (r.method === "Cash" && toTrim > 0) { const cut = Math.min(amount, toTrim); amount = round(amount - cut); toTrim = round(toTrim - cut) }
      return { treasuryId: r.treasuryId, method: r.method, amount }
    }).reverse().filter((p) => p.amount > 0)
    onConfirm(payments, print)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("pos.payTitle")}</DialogTitle>
          <DialogDescription>{t("pos.payHint")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline justify-between rounded-xl bg-secondary px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("pos.due")}</span>
              <span className="text-2xl font-bold text-primary tabular-nums">{formatMoney(total)}</span>
            </div>

            <ul className="flex flex-col gap-2">
              {rows.map((r, i) => (
                <li key={r.id} onClick={() => select(i)} className={cn("flex flex-col gap-2 rounded-xl border p-3", active === i && "border-primary ring-1 ring-primary")}>
                  <div className="flex items-center gap-2">
                    <Select value={r.method} onValueChange={(v) => patch(i, { method: v as PaymentMethod })}>
                      <SelectTrigger className="h-10 flex-1" aria-label={t("sales.method")}><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{t(`sales.methods.${m}`)}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={r.treasuryId ? String(r.treasuryId) : undefined} onValueChange={(v) => patch(i, { treasuryId: Number(v) })}>
                      <SelectTrigger className="h-10 flex-1" aria-label={t("sales.treasury")}><SelectValue placeholder={t("sales.treasury")} /></SelectTrigger>
                      <SelectContent>{treasuries.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {rows.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={t("common.remove")} onClick={(e) => { e.stopPropagation(); remove(i) }}><Trash2 /></Button>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 flex-1 items-center rounded-lg border bg-background px-3 text-xl font-semibold tabular-nums" dir="ltr">{r.raw}</div>
                    <Button type="button" variant="outline" className="h-12" onClick={(e) => { e.stopPropagation(); fillRest(i) }}>{t("pos.fillRest")}</Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={add}><Plus />{t("pos.split")}</Button>
              {quick.map((v) => <Button key={v} type="button" variant="secondary" onClick={() => { patch(active, { raw: v.toFixed(2) }); setFresh(true) }}>{formatMoney(v)}</Button>)}
            </div>

            <dl className="grid gap-1.5 rounded-xl border p-3 text-sm tabular-nums">
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("sales.paid")}</dt><dd className="font-semibold">{formatMoney(paid)}</dd></div>
              {remaining > 0.005 && <div className="flex justify-between"><dt className="text-muted-foreground">{hasCustomer ? t("pos.onAccount") : t("sales.remaining")}</dt><dd className={cn("font-semibold", !hasCustomer && "text-destructive")}>{formatMoney(remaining)}</dd></div>}
              {change > 0.005 && <div className="flex justify-between text-base"><dt>{t("pos.change")}</dt><dd className="font-bold text-success">{formatMoney(change)}</dd></div>}
            </dl>
            {badOver && <p role="alert" className="text-sm text-destructive">{t("sales.overpaid")}</p>}
            {!unpaidOk && <p role="alert" className="text-sm text-destructive">{t("pos.needsFullPayment")}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2" dir="ltr">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((k) => <Button key={k} type="button" variant="outline" className="h-14 text-xl" onClick={() => press(k)}>{k}</Button>)}
              <Button type="button" variant="outline" className="h-14" aria-label={t("pos.backspace")} onClick={() => press("back")}><Delete /></Button>
            </div>
            <Button type="button" size="lg" className="mt-auto h-14 text-base" disabled={!canConfirm} onClick={() => confirm(true)}>
              {pending ? <Loader2 className="animate-spin" /> : <Printer />}{t("pos.confirm")}
            </Button>
            <Button type="button" variant="outline" size="lg" disabled={!canConfirm} onClick={() => confirm(false)}><Save />{t("pos.saveOnly")}</Button>
            <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
