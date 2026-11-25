import { useState } from "react"
import { CirclePause, Clock, ReceiptText, Tag, Trash2, TriangleAlert, WalletCards, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Totals } from "@/modules/sales/types"
import type { CartDiscount } from "../../types"
import { CheckThenDiscard } from "../../shared/CheckThenDiscard"

const money = (n: number) => n.toFixed(2)
const auxTile = "border-[#dfe7f1] bg-white text-[#344766] hover:border-[#344766]/30 hover:bg-[#344766]/5 dark:border-border dark:bg-card dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/5"
const deleteTile = "border-red-100 bg-[#fff8f8] text-red-500 hover:border-red-300 hover:bg-red-50 dark:border-destructive/20 dark:bg-destructive/5 dark:text-destructive dark:hover:border-destructive/40 dark:hover:bg-destructive/10"
const wideTile = "group flex h-full min-h-[54px] w-full flex-col items-center justify-center gap-1.125 rounded-[9px] border px-1.5 py-1.5 text-[12px] font-bold shadow-[0_2px_7px_rgba(15,46,87,0.04)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
const narrowTile = "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-bold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
const discountBox = "h-6.75 w-[54px] rounded-[6px] border border-[#dfe7f1] bg-white px-0.75 text-center text-[13px] text-[#17375f] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background dark:text-foreground"

type Props = {
  totals: Totals
  /** The same sale without the invoice discount, struck through next to the real figures while one applies. */
  undiscounted: Totals
  discount: CartDiscount
  onDiscount: (d: CartDiscount) => void
  exempt: boolean
  locked: boolean
  uncertain: boolean
  busy: boolean
  onQuotation: () => void
  onHold: () => void
  onClear: () => void
  onHeld: () => void
  onPay: () => void
  /** After the unconfirmed sale is dropped from the locked cart. */
  onDiscarded: () => void
  /** The optics screen: no quotation or hold tiles, and a shorter pay button under the other two, as in the current POS. */
  optics?: boolean
  /** The cart is a customer order: paying becomes saving the order, and the quotation / hold tiles go. */
  orderMode?: boolean
}

/**
 * Under the lines, laid out as in the current second sales screen: totals with the invoice discount, the
 * after-discount and tax totals, the quotation / hold / clear / invoices tiles, and the pay button.
 * On a phone the pay button is a bar fixed to the bottom.
 */
export function SalesSummary({ totals, undiscounted, discount, onDiscount, exempt, locked, uncertain, busy, onQuotation, onHold, onClear, onHeld, onPay, onDiscarded, optics = false, orderMode = false }: Props) {
  const { t } = useTranslation()
  const [pct, setPct] = useState("")
  const [flat, setFlat] = useState("")
  const applied = discount.value > 0
  const payLabel = orderMode ? t("orderRequests.saveOrder") : t("pos2.pay")
  const afterDiscount = totals.grandTotal - totals.tax

  const apply = () => {
    const p = parseFloat(pct)
    const f = parseFloat(flat)
    if (Number.isFinite(p) && p > 0) onDiscount({ kind: "percent", value: Math.min(p, 100) })
    else if (Number.isFinite(f) && f > 0) onDiscount({ kind: "value", value: f })
  }
  const clear = () => { onDiscount({ kind: "value", value: 0 }); setPct(""); setFlat("") }
  const typed = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => /^\d*\.?\d*$/.test(e.target.value) && set(e.target.value)

  const tiles = (wide: boolean): { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[] => [
    ...(optics || orderMode ? [] : [
      { icon: Tag, label: t("pos2.quotations"), onClick: onQuotation, disabled: locked },
      { icon: wide ? Clock : CirclePause, label: t("pos2.hold"), onClick: onHold, disabled: locked || busy },
    ]),
    { icon: Trash2, label: t("pos2.delete"), onClick: onClear, danger: true, disabled: locked },
    { icon: ReceiptText, label: t("pos2.invoicesList"), onClick: onHeld },
  ]

  return (
    <>
      {uncertain && <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><div>{t("pos.lockedHint")}<CheckThenDiscard onDiscarded={onDiscarded} /></div></div>}
      <div style={{ fontSize: 9.375 }} className="w-full shrink-0 overflow-hidden rounded-[9px] border border-[#dfe7f1] bg-white shadow-[0_8px_24px_rgba(15,46,87,0.08)] dark:border-border dark:bg-background">
        <div className="hidden min-h-[138px] xl:grid" style={{ gridTemplateColumns: optics ? "minmax(285px,1.15fr) minmax(240px,1fr) 294px" : "minmax(285px,1.15fr) minmax(240px,1fr) 210px 84px" }}>
          <div className={cn("flex flex-col border-e border-[#e4eaf1] dark:border-border", optics && "row-span-2")}>
            <div className="flex h-[39px] items-center justify-between border-b border-[#e4eaf1] px-3.75 dark:border-border">
              <span className="text-[14px] font-bold text-[#17375f] dark:text-foreground">{t("pos2.beforeDiscount")}</span>
              <span className="text-[14.5px] font-extrabold text-[#17375f] tabular-nums dark:text-foreground">{money(totals.subTotal)}</span>
            </div>
            <div className="flex min-h-[58.5px] flex-1 flex-wrap items-center justify-between gap-2.25 border-b border-[#e4eaf1] px-3.75 py-1.5 dark:border-border">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-[14px] font-bold text-[#17375f] dark:text-foreground">{t("pos2.invoiceDiscount")}</span>
                {applied && (
                  <button type="button" disabled={locked} onClick={clear} aria-label={t("pos2.removeDiscount")}
                    className="flex min-h-[24px] items-center gap-1.125 rounded-full border border-red-200 bg-red-50 px-2.25 py-0.75 transition-colors hover:bg-red-100 active:bg-red-200">
                    <span className="text-[13px] font-semibold text-red-500">{discount.kind === "percent" ? `${discount.value}%` : money(discount.value)}</span>
                    <span className="flex size-3.75 items-center justify-center rounded-full bg-red-200 text-[13px] leading-none text-red-500 hover:bg-red-400 hover:text-white">×</span>
                  </button>
                )}
              </div>
              <div className="ms-auto flex items-end gap-1.5">
                <label className="flex flex-col items-center gap-0.375">
                  <span className="text-[12px] text-muted-foreground">{t("pos2.percentage")}</span>
                  <input inputMode="decimal" dir="ltr" value={pct} disabled={locked || applied || !!flat} onChange={typed(setPct)} className={discountBox} />
                </label>
                <label className="flex flex-col items-center gap-0.375">
                  <span className="text-[12px] text-muted-foreground">{t("pos2.value")}</span>
                  <input inputMode="decimal" dir="ltr" value={flat} disabled={locked || applied || !!pct} onChange={typed(setFlat)} className={discountBox} />
                </label>
                <Button type="button" size="sm" onClick={apply} disabled={locked || applied || (!pct && !flat)}
                  className="h-6.75 shrink-0 self-end rounded-full border border-[#17a95c] bg-[#1db56c] px-3.75 text-[13px] font-bold text-white transition-all duration-200 hover:bg-[#18a760] hover:text-white">
                  {t("pos2.apply")}
                </Button>
              </div>
            </div>
            <div className="flex h-[39px] items-center justify-between px-3.75">
              <span className="text-[14px] font-bold text-[#17375f] dark:text-foreground">{t("pos2.afterDiscount")}</span>
              <span className="text-[14.5px] font-extrabold text-[#17375f] tabular-nums dark:text-foreground">{money(afterDiscount)}</span>
            </div>
          </div>

          <div className={cn("grid border-e border-[#e4eaf1] bg-white dark:border-border dark:bg-background", exempt ? "content-start" : "grid-rows-3", optics && "row-span-2")}>
            {!exempt && <div className="flex min-h-[45.75px] items-center justify-between border-b border-[#e8edf3] px-4.5 dark:border-border">
              <span className="text-[14px] font-bold text-[#496683] dark:text-foreground">{t("pos2.totalBeforeTax")}</span>
              <span className="text-[14.5px] font-extrabold text-[#58708b] tabular-nums dark:text-foreground">{money(afterDiscount)}</span>
            </div>}
            {!exempt && <div className="flex min-h-[45.75px] items-center justify-between border-b border-[#e8edf3] px-4.5 dark:border-border">
              <span className="text-[14px] font-bold text-[#496683] dark:text-foreground">{t("pos2.totalTax")}</span>
              <span className="flex items-center gap-1.5">
                {applied && <span className="text-[11px] text-gray-300 line-through tabular-nums">{money(undiscounted.tax)}</span>}
                <span className="text-[14.5px] font-extrabold text-[#58708b] tabular-nums dark:text-foreground">{money(totals.tax)}</span>
              </span>
            </div>}
            <div className="flex min-h-[45.75px] items-center justify-between bg-[#f3f8fe] px-4.5 dark:bg-muted/20">
              <span className="text-[14.5px] font-extrabold text-[#345b86] dark:text-foreground">{t("pos2.finalTotal")}</span>
              <span className="flex items-center gap-1.5">
                {applied && (
                  <>
                    <button type="button" disabled={locked} onClick={clear} aria-label={t("pos2.removeDiscount")} className="flex size-3 items-center justify-center rounded-full bg-gray-200 text-[13px]/[1.333] leading-none text-gray-500 hover:bg-red-100 hover:text-red-500">×</button>
                    <span className="text-[11px] text-gray-300 line-through tabular-nums">{money(undiscounted.grandTotal)}</span>
                  </>
                )}
                <span className="text-[15.5px] font-black text-[#2874d0] tabular-nums">{money(totals.grandTotal)}</span>
              </span>
            </div>
          </div>

          <div className={cn("grid grid-cols-2 gap-1.5 border-e border-[#e4eaf1] bg-[#f8fafc] p-2.25 dark:border-border dark:bg-muted/20", !optics && "grid-rows-2")}>
            {tiles(true).map((x) => (
              <div key={x.label} className="flex items-center justify-center">
                <button type="button" onClick={x.onClick} disabled={x.disabled} className={cn(wideTile, x.danger ? deleteTile : auxTile)}>
                  <x.icon size={16.5} strokeWidth={1.9} className={x.icon === Tag ? "transition-transform duration-200 group-hover:rotate-[-8deg]" : x.danger ? "transition-transform duration-200 group-hover:scale-110" : undefined} />
                  <span>{x.label}</span>
                </button>
              </div>
            ))}
          </div>

          <div className={cn("flex flex-col items-stretch justify-center p-2.25", optics && "col-start-3 row-start-2 bg-[#f8fafc] pt-0 dark:bg-muted/20")}>
            <button type="button" onClick={onPay} disabled={busy}
              className={cn("group flex flex-1 items-center justify-center gap-2.25 rounded-[9px] border border-[#159b55] bg-[#1db56c] px-1.5 py-2.25 text-[12px]/[1.5] font-bold text-white shadow-[inset_0_-20px_30px_rgba(0,0,0,0.07),0_5px_13px_rgba(29,181,108,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#18a760] hover:shadow-[inset_0_-20px_30px_rgba(0,0,0,0.09),0_7px_16px_rgba(29,181,108,0.28)] active:translate-y-0 active:scale-[0.97] disabled:opacity-60", optics ? "min-h-[52px] flex-row" : "min-h-[120px] flex-col")}>
              <WalletCards size={25.5} strokeWidth={1.7} className="transition-transform duration-200 group-hover:scale-105" />
              <span>{payLabel}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col text-[13px] xl:hidden">
          <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/20 p-2">
            {tiles(false).map((x) => (
              <button key={x.label} type="button" onClick={x.onClick} disabled={x.disabled} className={cn(narrowTile, x.danger ? deleteTile : auxTile)}>
                <x.icon size={20} strokeWidth={2} />
                <span>{x.label}</span>
              </button>
            ))}
          </div>
          <dl className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300 rtl:divide-x-reverse dark:divide-border dark:border-border">
            <div className="flex items-center justify-between px-3 py-2"><dt className="text-gray-500 dark:text-muted-foreground">{t("pos2.total")}</dt><dd className="font-medium text-gray-800 tabular-nums dark:text-foreground">{money(totals.subTotal)}</dd></div>
            <div className="flex items-center justify-between px-3 py-2"><dt className="text-gray-500 dark:text-muted-foreground">{t("pos2.afterDiscountShort")}</dt><dd className="font-medium text-gray-800 tabular-nums dark:text-foreground">{money(afterDiscount)}</dd></div>
          </dl>
          <dl className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300 rtl:divide-x-reverse dark:divide-border dark:border-border">
            {!exempt && <div className="flex items-center justify-between px-3 py-2"><dt className="text-gray-500 dark:text-muted-foreground">{t("pos2.tax")}</dt><dd className="font-medium text-gray-800 tabular-nums dark:text-foreground">{money(totals.tax)}</dd></div>}
            <div className={cn("flex items-center justify-between px-3 py-2", exempt && "col-span-2")}><dt className="text-gray-500 dark:text-muted-foreground">{t("pos2.final")}</dt><dd className="font-medium text-blue-700 tabular-nums dark:text-primary">{money(totals.grandTotal)}</dd></div>
          </dl>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <span className="shrink-0 text-gray-500 dark:text-muted-foreground">{t("pos2.discount")}:</span>
            {applied ? (
              <button type="button" disabled={locked} onClick={clear} className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[13px] font-semibold text-red-500">
                {discount.kind === "percent" ? `${discount.value}%` : money(discount.value)} ×
              </button>
            ) : (
              <>
                <input inputMode="decimal" dir="ltr" placeholder={t("pos2.percentage")} value={pct} disabled={locked || !!flat} onChange={typed(setPct)} aria-label={t("pos2.percentage")} className="h-9 w-20 rounded border border-gray-300 px-1 text-center text-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background" />
                <input inputMode="decimal" dir="ltr" placeholder={t("pos2.value")} value={flat} disabled={locked || !!pct} onChange={typed(setFlat)} aria-label={t("pos2.value")} className="h-9 w-20 rounded border border-gray-300 px-1 text-center text-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-background" />
                <Button type="button" size="sm" onClick={apply} disabled={locked || (!pct && !flat)} className="h-9 shrink-0 self-end rounded bg-[#1db56c] px-4 text-xs text-white hover:bg-[#18a760]">{t("pos2.applyDiscount")}</Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl xl:hidden">
        <button type="button" onClick={onPay} disabled={busy}
          className="group flex h-14 w-full items-center justify-between rounded-2xl border border-[#15894a] bg-[#1da85d] px-5 text-white shadow-[0_10px_30px_rgba(15,86,49,0.32)] transition hover:bg-[#198f50] active:scale-[0.98] disabled:opacity-60">
          <span className="flex items-center gap-2 text-sm font-extrabold"><WalletCards size={21} strokeWidth={1.9} />{payLabel}</span>
          <strong className="text-lg font-black tabular-nums" dir="ltr">{money(totals.grandTotal)}</strong>
        </button>
      </div>
    </>
  )
}

