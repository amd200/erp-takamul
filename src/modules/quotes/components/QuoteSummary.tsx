import { useState } from "react"
import { Receipt, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format"
import type { Totals } from "@/modules/sales/types"

/**
 * The total that floats at the corner of the quotation form and opens a summary of the offer: who it is for,
 * how many items, and the amounts, as in the current system.
 */
export function QuoteSummary({ totals, customerName, date, count }: { totals: Totals; customerName: string; date: string; count: number }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const day = date ? new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "long", year: "numeric" }).format(new Date(date)) : "—"
  const afterDiscount = totals.subTotal - totals.discount
  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: t("quotes.beforeDiscount"), value: formatMoney(totals.subTotal) },
    { label: t("quotes.totalDiscount"), value: `- ${formatMoney(totals.discount)}` },
    { label: t("quotes.afterDiscount"), value: formatMoney(afterDiscount) },
    { label: t("quotes.beforeTax"), value: formatMoney(totals.grandTotal - totals.tax) },
    { label: t("quotes.finalTotal"), value: formatMoney(totals.grandTotal), strong: true },
  ]

  return (
    <>
      {open && (
        <div role="dialog" aria-label={t("quotes.summaryTitle")} className="fixed start-4 bottom-20 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{t("quotes.summaryTitle")}</h3>
            <button type="button" aria-label={t("common.close")} onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="space-y-4 text-sm">
            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("quotes.offerData")}</h4>
              <dl className="space-y-1">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("sales.customer")}</dt><dd>{customerName || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("quotes.issueDate")}</dt><dd>{day}</dd></div>
              </dl>
            </section>
            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("quotes.items")}</h4>
              <p>{count === 0 ? t("quotes.noItemsYet") : count}</p>
            </section>
            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">{t("quotes.amounts")}</h4>
              <dl className="space-y-1 tabular-nums">
                {rows.map((r) => (
                  <div key={r.label} className={`flex justify-between ${r.strong ? "border-t pt-1.5 font-bold" : ""}`}><dt className={r.strong ? undefined : "text-muted-foreground"}>{r.label}</dt><dd>{r.value}</dd></div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="fixed start-4 bottom-4 z-40 flex items-center gap-3 rounded-2xl border bg-card px-4 py-2 shadow-lg transition-shadow hover:shadow-xl">
        <span className="text-start">
          <span className="block text-[10px] text-muted-foreground">{t("quotes.total")}</span>
          <span className="block font-bold tabular-nums">{formatMoney(totals.grandTotal)}</span>
        </span>
        <Receipt size={18} className="text-muted-foreground" />
      </button>
    </>
  )
}
