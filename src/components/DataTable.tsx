import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  columnFilteringFeature, createFilteredRowModel, createPaginatedRowModel, createColumnHelper, globalFilteringFeature, rowPaginationFeature, tableFeatures, useTable,
  type FilterFn, type PaginationState, type RowData,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Pager } from "./Pager"

export type Column<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  align?: "start" | "end"
  className?: string
  /** Fixed column width (e.g. "30%"); when any column sets it the table uses a fixed layout so tabs line up. */
  width?: string
  /** The server field to sort by when this header is clicked (needs `server.sort`). */
  sortKey?: string
  /** Marks the automatic serial-number column (added by the table itself, never by pages). */
  serial?: boolean
}

/**
 * Paging and search done by the server: `rows` is already the current page, the table only
 * reports page changes and (debounced) search text. Pages are zero-based here.
 */
export type ServerPaging = {
  total: number
  page: number
  pageSize: number
  onPage: (page: number) => void
  onSearch?: (q: string) => void
  /** True while a new page is loading behind the current one. */
  fetching?: boolean
  /** Same as the table's own `sort` prop (kept so older pages keep working). */
  sort?: TableSort
}

/** Current sort; clicking a sortable header toggles ascending / descending, as in the old system. */
export type TableSort = { key?: string; desc: boolean; onSort: (key: string | undefined, desc: boolean) => void }

const SEARCH_DELAY = 350
const EMPTY: never[] = []

// Search and paging run in TanStack Table. Sorting stays with the server (the headers only report it).
const features = tableFeatures({
  columnFilteringFeature, globalFilteringFeature, rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
})

/** The one list pattern used by every page: search and filters on top, quiet table, pager at the bottom. */
export function DataTable<T extends RowData>({
  rows, columns: columnsProp, rowKey, serial = true, loading, searchText, searchPlaceholder, filters, empty, emptyText, pageSize = 10, server, pager = true, sort: sortProp,
}: {
  rows: T[] | undefined
  columns: Column<T>[]
  /** The running-number column "م" (1, 2, 3 ... continuing across pages) shown first in every table; pass false to hide it. */
  serial?: boolean
  rowKey: (row: T) => string | number
  loading?: boolean
  /** Client-side search over loaded rows. With `server.onSearch` the search box asks the server instead. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
  filters?: ReactNode
  empty: ReactNode
  /** With this the table keeps its header when there are no rows and shows one row with this text, instead of `empty`. */
  emptyText?: string
  pageSize?: number
  server?: ServerPaging
  /** False drops the footer (page numbers), for short fixed lists such as the home page's latest five. */
  pager?: boolean
  /** Sort done by the server (works with server paging or with a fully loaded list); headers with a `sortKey` become buttons. */
  sort?: TableSort
}) {
  const { t } = useTranslation()
  const header = t("common.serial")
  const columns = useMemo<Column<T>[]>(() => (serial ? [{ id: "serial", header, width: "64px", serial: true, cell: () => null }, ...columnsProp] : columnsProp), [serial, header, columnsProp])
  const [q, setQ] = useState("")
  const onSearch = server?.onSearch
  const sort = sortProp ?? server?.sort

  // Server search waits for the user to stop typing.
  useEffect(() => {
    if (!onSearch) return
    const id = setTimeout(() => onSearch(q.trim()), SEARCH_DELAY)
    return () => clearTimeout(id)
  }, [q, onSearch])

  const searchRef = useRef(searchText)
  searchRef.current = searchText
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const helper = useMemo(() => createColumnHelper<typeof features, T>(), [])
  // The columns are rebuilt only when their ids or headers change; each cell reads the latest column it belongs to.
  const columnKey = columns.map((c) => `${c.id}:${c.header}`).join("|")
  const defs = useMemo(() => helper.columns(columnsRef.current.map((c) => helper.accessor((r: T) => searchRef.current?.(r) ?? "", {
    id: c.id, header: c.header, cell: ({ row }) => columnsRef.current.find((x) => x.id === c.id)?.cell(row.original),
  }))), [helper, columnKey]) // eslint-disable-line react-hooks/exhaustive-deps
  // One column carries the search over the whole row, so a row matches when its search text has the term.
  const matches: FilterFn<typeof features, T> = (row, _id, term: string) => (searchRef.current?.(row.original) ?? "").toLowerCase().includes(term.toLowerCase())

  const table = useTable({
    features, columns: defs, data: rows ?? EMPTY,
    state: { pagination: { pageIndex: server ? server.page : pagination.pageIndex, pageSize: server ? server.pageSize : pageSize }, globalFilter: server ? "" : q.trim() },
    onPaginationChange: setPagination,
    getRowId: (r) => String(rowKey(r)),
    globalFilterFn: matches,
    getColumnCanGlobalFilter: (c) => c.id === columnsProp[0]?.id,
    manualFiltering: !!server, manualPagination: !!server, rowCount: server?.total, autoResetPageIndex: false,
  })

  const filteredCount = table.getPrePaginatedRowModel().rows.length
  const current = server ? server.page : Math.min(pagination.pageIndex, Math.max(0, Math.ceil(filteredCount / pageSize) - 1))
  const slice = table.getRowModel().rows
  const hasSearch = !!(searchText || onSearch)
  // No rows: a custom `empty` block replaces the table; with `emptyText` (or no `empty` at all) the header stays and one row says there is nothing.
  const showEmptyRow = slice.length === 0 && (!!emptyText || empty == null)
  const firstNo = (server ? server.page : current) * (server ? server.pageSize : pageSize)
  const render = (c: Column<T>, r: T, i: number) => (c.serial ? firstNo + i + 1 : c.cell(r))
  const setPage = (n: number) => setPagination((p) => ({ ...p, pageIndex: n }))

  // When the current page ends up empty (its last row was deleted, or a refetch has fewer pages), step back to the last page that has rows.
  const count = server ? server.total : filteredCount
  const size = server ? server.pageSize : pageSize
  const shown = server ? server.page : pagination.pageIndex
  const settled = !loading && !server?.fetching
  useEffect(() => {
    if (!settled || shown <= 0) return
    const last = Math.max(0, Math.ceil(count / size) - 1)
    if (shown > last) { if (server) server.onPage(last); else setPagination((p) => ({ ...p, pageIndex: last })) }
  }, [settled, shown, count, size]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {(hasSearch || filters) && (
        <div className={"flex flex-wrap items-center gap-2"}>
          {hasSearch && (
            <div className={"relative min-w-52 max-w-sm flex-1"}>
              <Search className={"pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint"} />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0) }}
                placeholder={searchPlaceholder ?? t("common.search")}
                aria-label={searchPlaceholder ?? t("common.search")}
                className="h-10 ps-9"
              />
              {server?.fetching && <Loader2 className={"absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-faint"} aria-label={t("common.loading")} />}
            </div>
          )}
          {filters}
        </div>
      )}

      {loading ? (
        <div className={"flex flex-col gap-2"} aria-busy="true" aria-label={t("common.loading")}>
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : slice.length === 0 && !showEmptyRow ? (
        empty
      ) : (
        <>
          {/* Phones: a wide table would scroll sideways, so each row becomes a card (label on one side, value on the other). */}
          <ul className={cn("flex flex-col gap-2 transition-opacity sm:hidden", server?.fetching && "opacity-60", slice.length === 0 && "hidden")}>
            {slice.map((row, ri) => {
              const r = row.original
              const labelled = columns.filter((c) => c.header && c.id !== "actions" && !c.serial)
              const actions = columns.filter((c) => !c.header || c.id === "actions")
              return (
                <li key={row.id} className="rounded-xl border bg-card px-3 py-2.5">
                  <dl className="flex flex-col gap-1.5 text-sm">
                    {labelled.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between gap-3">
                        <dt className="shrink-0 text-xs text-muted-foreground">{c.header}</dt>
                        <dd className={cn("min-w-0 text-end tabular-nums", i === 0 && "font-semibold", c.className)}>{render(c, r, ri)}</dd>
                      </div>
                    ))}
                  </dl>
                  {actions.length > 0 && <div className="mt-2 flex items-center justify-end gap-1 border-t pt-2">{actions.map((c) => <div key={c.id}>{render(c, r, ri)}</div>)}</div>}
                </li>
              )
            })}
          </ul>
          <Table className={cn("min-w-[640px] transition-opacity", columnsProp.some((c) => c.width) && "table-fixed", slice.length > 0 && "max-sm:hidden", server?.fetching && "opacity-60")}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead key={c.id} style={c.width ? { width: c.width } : undefined} aria-sort={c.sortKey && sort?.key === c.sortKey ? (sort.desc ? "descending" : "ascending") : undefined}
                    className="font-medium text-muted-foreground">
                    {c.sortKey && sort ? <SortButton column={c} sort={sort} onSorted={() => setPage(0)} /> : c.id === "actions" && !c.header ? t("common.actions") : c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.length === 0 && (
                <TableRow className="hover:bg-transparent"><TableCell colSpan={columns.length} className="py-6 font-normal text-muted-foreground">{emptyText ?? t("common.noData")}</TableCell></TableRow>
              )}
              {slice.map((row, ri) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("tabular-nums py-3", columnsProp.some((c) => c.width) && "overflow-hidden text-ellipsis", columns.find((c) => c.id === cell.column.id)?.className)}>{columns.find((c) => c.id === cell.column.id)?.serial ? firstNo + ri + 1 : <table.FlexRender cell={cell} />}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {!loading && pager && (
        <div>
          {server
            ? <Pager total={server.total} page={server.page} pageSize={server.pageSize} onPage={server.onPage} />
            : <Pager total={filteredCount} page={current} pageSize={pageSize} onPage={setPage} />}
        </div>
      )}
    </div>
  )
}

function SortButton<T>({ column, sort, onSorted }: { column: Column<T>; sort: TableSort; onSorted: () => void }) {
  const active = sort.key === column.sortKey
  const Icon = !active ? ArrowUpDown : sort.desc ? ArrowDown : ArrowUp
  // ascending <-> descending (a sorted column never goes back to unsorted, like the old system)
  const next = () => { sort.onSort(column.sortKey, active && !sort.desc); onSorted() }
  return (
    <button type="button" onClick={next} className={cn("-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground", active && "text-foreground")}>
      {column.header}<Icon className={cn("size-3.5", !active && "text-faint")} />
    </button>
  )
}
