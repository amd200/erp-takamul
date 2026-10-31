import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileSpreadsheet, Filter, Printer, RotateCcw, Search, WalletCards } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { downloadCsv } from "@/modules/reports/export"
import type { ReportResult } from "@/modules/reports/types"
import { useStatement, useTreasuryList } from "../queries"
import type { StatementRow } from "../types"

type Filter = { treasuryId?: number; from: string; to: string }
const num = (v?: number) => Number(v ?? 0).toLocaleString("en-US")
const day = (v?: string) => {
  if (!v) return "-"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB")
}

/** The treasury statement, as in the current system: a titled box with print and Excel, a filters box, the chosen filters, and a plain table. */
export default function TreasuryStatementPage() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const { data: treasuries = [] } = useTreasuryList()
  const first = Number(params.get("treasury")) || undefined
  const [filters, setFilters] = useState<Filter>({ treasuryId: first, from: "", to: "" })
  const [applied, setApplied] = useState<Filter>({ treasuryId: first, from: "", to: "" })
  const { data: moves = [], isFetching } = useStatement(applied.treasuryId, applied.from, applied.to)
  const treasuryName = treasuries.find((x) => x.id === applied.treasuryId)?.name ?? ""
  const rows = applied.treasuryId ? moves : []

  const columns: Column<StatementRow>[] = [
    { id: "type", header: t("oldStatement.type"), cell: (r) => r.type },
    { id: "date", header: t("oldStatement.date"), cell: (r) => <span className="whitespace-nowrap">{day(r.date)}</span> },
    { id: "number", header: t("oldStatement.number"), cell: (r) => <span className="break-all">{r.number}</span> },
    { id: "party", header: t("oldStatement.party"), cell: (r) => r.partyName || "-" },
    { id: "debit", header: t("oldStatement.debit"), cell: (r) => <span className="whitespace-nowrap">{num(r.debit)}</span> },
    { id: "credit", header: t("oldStatement.credit"), cell: (r) => <span className="whitespace-nowrap">{num(r.credit)}</span> },
    { id: "balance", header: t("oldStatement.balance"), cell: (r) => <span className="font-semibold whitespace-nowrap text-primary">{num(r.balance)}</span> },
  ]

  // The same movements in the shape the shared Excel export reads.
  const exportable = useMemo<ReportResult>(() => {
    const body = rows.map((m) => ({ date: m.date, type: { text: m.type, tone: "muted" as const }, doc: m.number, party: m.partyName || "—", in: m.debit > 0 ? m.debit : null, out: m.credit > 0 ? m.credit : null, balance: m.balance }))
    const totalIn = body.reduce((s, r) => s + (r.in ?? 0), 0), totalOut = body.reduce((s, r) => s + (r.out ?? 0), 0)
    return {
      stats: [],
      columns: [{ id: "date", kind: "date" }, { id: "type", kind: "badge" }, { id: "doc", kind: "text", strong: true }, { id: "party", kind: "text" }, { id: "in", kind: "money" }, { id: "out", kind: "money" }, { id: "balance", kind: "money", strong: true }],
      rows: body, totals: { date: "", in: totalIn, out: totalOut, balance: body.length ? body[body.length - 1].balance : 0 },
    }
  }, [rows])

  const clear = () => { const empty: Filter = { treasuryId: undefined, from: "", to: "" }; setFilters(empty); setApplied(empty) }
  const link = "flex items-center gap-1.5 text-slate-600 transition-colors hover:text-primary disabled:opacity-50"

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-2xl leading-snug font-bold"><WalletCards size={20} className="text-primary" />{t("oldStatement.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("oldStatement.subtitle")}</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <button type="button" className={link} disabled={!rows.length} onClick={() => window.print()}><Printer size={16} /><span className="hidden sm:inline">{t("oldStatement.print")}</span></button>
          <button type="button" className={link} disabled={!rows.length} onClick={() => downloadCsv(`treasury-${applied.treasuryId}`, exportable, t, i18n.language)}><FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span></button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[rgba(49,201,110,0.12)]"><Filter size={18} className="text-primary" /></div>
            <div>
              <h3 className="text-sm font-bold md:text-base">{t("oldStatement.filters")}</h3>
              <p className="text-xs text-muted-foreground md:text-sm">{t("oldStatement.filtersHint")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="st-treasury">{t("oldStatement.treasury")}</FieldLabel>
              <Select value={filters.treasuryId ? String(filters.treasuryId) : ""} onValueChange={(v) => setFilters((f) => ({ ...f, treasuryId: Number(v) }))}>
                <SelectTrigger id="st-treasury" className="h-10 w-full"><SelectValue placeholder={t("oldStatement.pickTreasury")} /></SelectTrigger>
                <SelectContent>{treasuries.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field><FieldLabel htmlFor="st-from">{t("oldStatement.from")}</FieldLabel><Input id="st-from" type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></Field>
            <Field><FieldLabel htmlFor="st-to">{t("oldStatement.to")}</FieldLabel><Input id="st-to" type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></Field>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
              <Button type="button" className="w-full sm:w-auto" onClick={() => setApplied(filters)}><Search size={18} />{t("oldStatement.show")}</Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={clear}><RotateCcw size={16} />{t("oldStatement.clear")}</Button>
            </div>
          </div>
        </div>

        {applied.treasuryId && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3">
            <span className="text-xs text-muted-foreground">{t("oldStatement.selected")}:</span>
            <span className="rounded-full bg-[rgba(49,201,110,0.12)] px-3 py-1 text-xs font-medium text-primary">{treasuryName || t("oldStatement.treasury")}</span>
            {applied.from && <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium">{t("oldStatement.fromShort")}: {applied.from}</span>}
            {applied.to && <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium">{t("oldStatement.toShort")}: {applied.to}</span>}
          </div>
        )}

        <DataTable rows={rows} loading={isFetching && !!applied.treasuryId} columns={columns} rowKey={(r) => `${r.number}-${r.date}-${r.balance}`} searchPlaceholder={t("oldStatement.search")}
          emptyText={t("oldStatement.empty")} empty={null} />
      </div>
    </div>
  )
}
