import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { useAppSettings } from "@/modules/settings"
import { excelReport, pdfReport, printReport, type OutputColumn, type ReportOutput } from "./output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "./ReportShell"
import { ReportTable } from "./ReportTable"
import { useFiscalFilters, type Fiscal } from "./useFiscalFilters"
import { reportKeys } from "../keys"

export type Sort = { key?: string; desc: boolean }

/** One page of rows the server sent whole (reports that are not paged on the server). */
export const slice = <T,>(items: T[], page: number, size: number) => items.slice((page - 1) * size, page * size)

/**
 * A report laid out as in the current system and read from the server one page at a time: summary tiles,
 * the filters (fiscal year/quarter, dates and the report's own `extra` ones), the table, and print / PDF / Excel
 * (which read every page). Nothing loads before the first search.
 */
export function PagedReport<T extends object, R>({ id, title, icon, extra, withFiscal = false, dates = true, dep, filterText, enabled = true, defaultSort, read, rowsOf, totalOf, cards, columns, outColumns, rowKey, onSearch, onClear, exportAll = true }: {
  id: string; title: string; icon: LucideIcon
  extra?: ReactNode; withFiscal?: boolean
  /** False for a report with no date range. */
  dates?: boolean
  /** The report's own applied filters, in the query key. */
  dep?: unknown
  filterText: (applied: Fiscal) => string
  enabled?: boolean
  defaultSort?: Sort
  read: (applied: Fiscal, page: number, size: number, sort: Sort) => Promise<R>
  rowsOf: (r: R) => T[]
  totalOf: (r: R) => number
  cards: (r: R | undefined) => SummaryCard[]
  columns: Column<T>[]
  outColumns: OutputColumn<T>[]
  rowKey: (row: T, index: number) => string | number
  onSearch?: () => void
  onClear?: () => void
  /** False when the endpoint is not paged: print / PDF / Excel use the rows already read. */
  exportAll?: boolean
}) {
  const { t } = useTranslation()
  const size = Number(useAppSettings().generalTab?.rowsPerPage) || 10
  const f = useFiscalFilters()
  const [sort, setSort] = useState<Sort>(defaultSort ?? { desc: false })
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const { data, isFetching } = useQuery({
    queryKey: reportKeys.oldReport(id, f.applied, dep, sort, page, size),
    queryFn: () => read(f.applied, page + 1, size, sort),
    enabled: f.searched && enabled,
    placeholderData: (p) => p,
  })
  const shown = f.searched && enabled ? data : undefined
  const rows = shown ? rowsOf(shown) : []

  const out: Omit<ReportOutput<T>, "rows"> = {
    title, cards: cards(shown), filters: filterText(f.applied),
    columns: [{ header: t("oldReports.serial"), value: (_, i) => i + 1 }, ...outColumns],
  }
  const all = async () => {
    if (!exportAll) return rows
    const list: T[] = []
    for (let p = 1; p <= 50; p++) {
      const r = rowsOf(await read(f.applied, p, 200, sort))
      list.push(...r)
      if (r.length < 200) break
    }
    return list
  }
  const exportWith = (fn: (o: ReportOutput<T>) => unknown) => async () => {
    if (!rows.length) return
    setBusy(true)
    try { await fn({ ...out, rows: await all() }) } finally { setBusy(false) }
  }

  const withSerial: Column<T>[] = [{ id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{page * size + rows.indexOf(r) + 1}</span> }, ...columns]
  const reset = () => { setPage(0) }

  return (
    <ReportShell title={title} icon={icon} onPrint={exportWith(printReport)} onExcel={exportWith(excelReport)} pdfBusy={busy} onPdf={exportWith(pdfReport)}>
      <SummaryCards cards={out.cards} />
      <FiscalFilters withFiscal={withFiscal} dates={dates} extra={extra} loading={isFetching}
        f={{ ...f, search: () => { onSearch?.(); f.search(); reset() }, clear: () => { onClear?.(); f.clear(); reset() } }} />
      <ReportTable rows={rows} columns={withSerial} loading={isFetching} searched={f.searched && enabled} rowKey={(r) => rowKey(r, rows.indexOf(r))} pageSize={size}
        server={{ total: shown ? totalOf(shown) : 0, page, pageSize: size, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); reset() } } }} />
    </ReportShell>
  )
}
