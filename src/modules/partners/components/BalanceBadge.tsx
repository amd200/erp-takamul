import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format"

/**
 * A party balance as amount + side. `owesUs` is the side where the party owes the business
 * (a customer's debit, a supplier's debit after over-paying).
 */
export function BalanceCell({ value, owesUsWhenPositive }: { value: number; owesUsWhenPositive: boolean }) {
  const { t } = useTranslation()
  if (Math.abs(value) < 0.005) return <span className="text-faint">{formatMoney(0)}</span>
  const owesUs = owesUsWhenPositive ? value > 0 : value < 0
  return (
    <span className="inline-flex items-baseline gap-1.5 tabular-nums">
      <span className={owesUs ? "font-semibold text-warning" : "font-semibold"}>{formatMoney(Math.abs(value))}</span>
      <span className="text-xs text-muted-foreground">{t(owesUs ? "partners.debitShort" : "partners.creditShort")}</span>
    </span>
  )
}
