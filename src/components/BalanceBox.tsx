import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format"
import { StatusBadge } from "@/components/StatusBadge"

/** Small inline balance line (label, amount, then the side as a tiny coloured tag), shown under a customer/supplier select. */
export function BalanceBox({ label, value, debitWhenPositive }: { label: string; value: number | null; debitWhenPositive: boolean }) {
  const { t } = useTranslation()
  if (value == null) return null
  const debit = value !== 0 && (debitWhenPositive ? value > 0 : value < 0)
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>{label}:</span>
      <span className="font-semibold tabular-nums text-foreground">{formatMoney(Math.abs(value))}</span>
      {value !== 0 && <StatusBadge tone={debit ? "danger" : "success"} className="px-1.5 py-0.5 text-[11px]">{t(debit ? "sales.debtor" : "sales.creditor")}</StatusBadge>}
    </div>
  )
}
