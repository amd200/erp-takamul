import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format"
import { CurrencySymbol, useAppSettings } from "@/modules/settings"
import type { Totals } from "../types"

/** Subtotal → discount → tax → total, plus paid / remaining when payments apply. */
export function TotalsPanel({ totals, paid, returned }: { totals: Totals; paid?: number; returned?: number }) {
  const { t } = useTranslation()
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  // A tax-exempt branch has no tax to show.
  const exempt = taxSetting === "Exempt"
  const remaining = paid == null ? null : Math.max(0, totals.grandTotal - (returned ?? 0) - paid)
  const Row = ({ label, value, strong, tone }: { label: string; value: number; strong?: boolean; tone?: string }) => (
    <div className={`flex justify-between ${strong ? "border-t pt-2.5 text-base font-semibold" : ""}`}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd dir="ltr" className={tone}>{formatMoney(value)}{strong && <span className="ms-1 text-xs font-normal text-muted-foreground"><CurrencySymbol /></span>}</dd>
    </div>
  )
  return (
    <dl className="flex flex-col gap-2.5 tabular-nums">
      <Row label={t("sales.subTotal")} value={totals.subTotal} />
      {totals.discount > 0 && <Row label={t("sales.discount")} value={-totals.discount} />}
      {!exempt && <Row label={t("sales.tax")} value={totals.tax} />}
      <Row label={t("sales.grandTotal")} value={totals.grandTotal} strong />
      {!!returned && <Row label={t("sales.returned")} value={-returned} />}
      {paid != null && <Row label={t("sales.paid")} value={paid} tone="text-success" />}
      {remaining != null && <Row label={t("sales.remaining")} value={remaining} tone={remaining > 0 ? "font-semibold text-destructive" : undefined} />}
    </dl>
  )
}
