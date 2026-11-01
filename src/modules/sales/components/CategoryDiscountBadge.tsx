import { Tag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { InvoiceLine } from "../types"

/** Marks a line whose discount comes from its category: the server uses that one and ignores the cashier's. */
export function CategoryDiscountBadge({ line, className }: { line: Pick<InvoiceLine, "categoryDiscount">; className?: string }) {
  const { t } = useTranslation()
  const c = line.categoryDiscount
  if (!c) return null
  return (
    <span title={c.kind === "percent" ? t("sales.categoryDiscountHintPercent", { value: c.value }) : t("sales.categoryDiscountHintValue", { value: formatMoney(c.value) })} className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-primary", className)}>
      <Tag className="size-2.5" aria-hidden />
      {t("sales.categoryDiscount")} {c.kind === "percent" ? `${c.value}%` : `-${formatMoney(c.value)}`}
    </span>
  )
}
