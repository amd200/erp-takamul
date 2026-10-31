import type { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Header + rows for repeated field groups (extra units, components, branch children).
 * `cols` is a Tailwind grid template shared by the header and every row.
 */
export function RepeatRows({ headers, cols, count, renderRow, onRemove, empty, error }: {
  headers: string[]
  cols: string
  count: number
  renderRow: (index: number) => ReactNode
  onRemove: (index: number) => void
  empty: string
  error?: string
}) {
  const { t } = useTranslation()
  if (count === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed px-4 py-7 text-center text-muted-foreground", error && "border-destructive text-destructive")}>
        {error ?? empty}
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] flex-col gap-2">
        <div className={cn("grid gap-2 text-xs font-medium text-muted-foreground", cols)}>
          {headers.map((h) => <span key={h}>{h}</span>)}
          <span />
        </div>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn("grid items-start gap-2", cols)}>
            {renderRow(i)}
            <Button type="button" variant="ghost" size="icon-lg" aria-label={t("common.remove")} onClick={() => onRemove(i)} className="hover:bg-destructive-soft hover:text-destructive">
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
