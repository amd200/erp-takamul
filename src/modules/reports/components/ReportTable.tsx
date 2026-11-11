import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pager } from "@/components/Pager"
import { cn } from "@/lib/utils"
import { cellText } from "../format"
import type { Cell, Column, Row } from "../types"

const TONE = { good: "success", warn: "warning", bad: "danger", muted: "neutral" } as const
const sortValue = (c: Cell) => (c == null ? -Infinity : typeof c === "object" ? c.text : c)

/** Report rows with click-to-sort headers and a totals footer. Numbers align to the end. */
const PAGE_SIZE = 25

export function ReportTable({ columns, rows, totals }: { columns: Column[]; rows: Row[]; totals?: Row }) {
  const { t, i18n } = useTranslation()
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    return [...rows].sort((a, b) => {
      const x = sortValue(a[sort.id]), y = sortValue(b[sort.id])
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir
    })
  }, [rows, sort])

  const current = Math.min(page, Math.max(0, Math.ceil(sorted.length / PAGE_SIZE) - 1))
  const visible = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const toggle = (id: string) => { setPage(0); setSort((s) => (s?.id !== id ? { id, dir: -1 } : s.dir === -1 ? { id, dir: 1 } : null)) }

  return (
    <div className="flex flex-col gap-4">
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead key={c.id} className="font-medium text-muted-foreground"
              aria-sort={sort?.id === c.id ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
              <button type="button" onClick={() => toggle(c.id)} className="inline-flex items-center gap-1 hover:text-foreground print:pointer-events-none">
                {t(`reports.c.${c.id}`)}
                {sort?.id === c.id ? (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 text-faint print:hidden" />}
              </button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {visible.map((r, i) => (
          <TableRow key={i}>
            {columns.map((c) => {
              const v = r[c.id]
              return (
                <TableCell key={c.id} className={cn("py-2.5 tabular-nums", c.strong && "font-semibold", v == null && "text-faint")}>
                  {c.kind === "badge" && v && typeof v === "object"
                    ? <StatusBadge tone={TONE[v.tone]}>{cellText(v, c.kind, t, i18n.language)}</StatusBadge>
                    : cellText(v, c.kind, t, i18n.language)}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
      {totals && (
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            {columns.map((c, i) => (
              <TableCell key={c.id} className={cn("py-3 font-semibold tabular-nums")}>
                {i === 0 ? t("reports.total") : totals[c.id] == null || totals[c.id] === "" ? "" : cellText(totals[c.id], c.kind, t, i18n.language)}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      )}
    </Table>
    <Pager total={sorted.length} page={current} pageSize={PAGE_SIZE} onPage={setPage} />
    </div>
  )
}
