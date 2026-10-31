import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"

/** Page numbers with gaps: 1 … 4 5 [6] 7 8 … 20. */
function pageList(current: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i)
  const set = new Set([0, pages - 1, current - 1, current, current + 1])
  if (current <= 2) [1, 2, 3].forEach((n) => set.add(n))
  if (current >= pages - 3) [pages - 2, pages - 3, pages - 4].forEach((n) => set.add(n))
  const sorted = [...set].filter((n) => n >= 0 && n < pages).sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["gap" as const, n] : [n]))
}

/**
 * Footer for any paged list: "showing 11-20 of 143" and page numbers.
 * Pages are zero-based here; the buttons show them from 1. Hidden when everything fits on one page.
 */
export function Pager({ total, page, pageSize, onPage, always }: { total: number; page: number; pageSize: number; onPage: (p: number) => void; /** Shows the first / previous / next / last buttons even when everything fits on one page, as the lists of the current system do. */ always?: boolean }) {
  const { t } = useTranslation()
  if (total <= pageSize && !always) return null
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages - 1)
  const from = current * pageSize + 1
  const to = Math.min(total, from + pageSize - 1)

  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-sm text-muted-foreground print:hidden", always ? "justify-center" : "justify-between")}>
      {!always && <span className="tabular-nums">{t("common.showing", { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}</span>}
      <nav aria-label={t("common.pages")} className="flex items-center gap-1">
        {always && <Button variant="ghost" size="icon" aria-label={t("common.first")} disabled={current === 0} onClick={() => onPage(0)}><ChevronsRight className="rtl:rotate-0 ltr:rotate-180" /></Button>}
        <Button variant="ghost" size="icon" aria-label={t("common.previous")} disabled={current === 0} onClick={() => onPage(current - 1)}>
          <ChevronRight className="rtl:rotate-0 ltr:rotate-180" />
        </Button>
        {pageList(current, pages).map((p, i) => p === "gap"
          ? <span key={`g${i}`} className="px-1 text-faint" aria-hidden>…</span>
          : (
            <Button key={p} variant="ghost" size="icon" aria-current={p === current ? "page" : undefined}
              aria-label={t("common.page", { n: p + 1 })} onClick={() => onPage(p)} className={cn("tabular-nums", p === current && "bg-[#ecfdf5] font-semibold text-[#10b981] hover:bg-[#ecfdf5] hover:text-[#10b981] dark:bg-primary dark:text-primary-foreground")}>
              {formatNumber(p + 1)}
            </Button>
          ))}
        <Button variant="ghost" size="icon" aria-label={t("common.next")} disabled={current >= pages - 1} onClick={() => onPage(current + 1)}>
          <ChevronLeft className="rtl:rotate-0 ltr:rotate-180" />
        </Button>
        {always && <Button variant="ghost" size="icon" aria-label={t("common.last")} disabled={current >= pages - 1} onClick={() => onPage(pages - 1)}><ChevronsLeft className="rtl:rotate-0 ltr:rotate-180" /></Button>}
      </nav>
    </div>
  )
}
