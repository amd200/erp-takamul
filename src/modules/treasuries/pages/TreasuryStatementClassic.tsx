import { PageBox } from "@/components/PageBox"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileSpreadsheet, FileText, Filter, Printer, RotateCcw, Search, WalletCards } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { excelReport, pdfReport, printReport, type ReportOutput } from "@/modules/reports/old/output"
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
export default function TreasuryStatementClassic() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const { data: treasuries = [] } = useTreasuryList()
  const first = Number(params.get("treasury")) || undefined
  const [filters, setFilters] = useState<Filter>({ treasuryId: first, from: "", to: "" })
  const [applied, setApplied] = useState<Filter>({ treasuryId: first, from: "", to: "" })
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data: moves = [], isFetching } = useStatement(applied.treasuryId, applied.from, applied.to, { SortBy: sortBy, SortDescending: sortDescending })
  const treasuryName = treasuries.find((x) => x.id === applied.treasuryId)?.name ?? ""
  const rows = applied.treasuryId ? moves : []

  const columns: Column<StatementRow>[] = [
    { id: "type", sortKey: "documentType", header: t("oldStatement.type"), cell: (r) => r.documentType },
    { id: "date", sortKey: "date", header: t("oldStatement.date"), cell: (r) => <span className="whitespace-nowrap">{day(r.date)}</span> },
    { id: "number", sortKey: "documentNumber", header: t("oldStatement.number"), cell: (r) => <span className="break-all">{r.documentNumber}</span> },
    { id: "party", sortKey: "description", header: t("oldStatement.description"), cell: (r) => r.description || "-" },
    { id: "debit", sortKey: "incomingAmount", header: t("oldStatement.debit"), cell: (r) => <span className="whitespace-nowrap">{num(r.incomingAmount)}</span> },
    { id: "credit", sortKey: "outgoingAmount", header: t("oldStatement.credit"), cell: (r) => <span className="whitespace-nowrap">{num(r.outgoingAmount)}</span> },
    { id: "balance", sortKey: "balance", header: t("oldStatement.balance"), cell: (r) => <span className="font-semibold whitespace-nowrap text-primary">{num(r.balance)}</span> },
  ]

  // Print, PDF and Excel read the same rows and filter line as the old system's.
  const dateText = (v: string) => (v ? v.split("-").reverse().join("/") : "-")
  const output: ReportOutput<StatementRow> = {
    title: t("oldStatement.title"), cards: [], rows,
    filters: `${t("oldStatement.treasury")}: ${treasuryName || t("oldStatement.all")} | ${t("oldStatement.from")}: ${dateText(applied.from)} | ${t("oldStatement.to")}: ${dateText(applied.to)}`,
    columns: [
      { header: t("oldStatement.serial"), value: (_, i) => i + 1 },
      { header: t("oldStatement.type"), value: (r) => r.documentType },
      { header: t("oldStatement.date"), value: (r) => day(r.date) },
      { header: t("oldStatement.number"), value: (r) => r.documentNumber },
      { header: t("oldStatement.party"), value: (r) => r.description || "-" },
      { header: t("oldStatement.debit"), value: (r) => r.incomingAmount },
      { header: t("oldStatement.credit"), value: (r) => r.outgoingAmount },
      { header: t("oldStatement.balance"), value: (r) => r.balance },
    ],
  }
  const [pdfBusy, setPdfBusy] = useState(false)
  const pdf = async () => { setPdfBusy(true); try { await pdfReport(output) } finally { setPdfBusy(false) } }

  const clear = () => { const empty: Filter = { treasuryId: undefined, from: "", to: "" }; setFilters(empty); setApplied(empty) }
  const link = "flex items-center gap-1.5 text-slate-600 transition-colors hover:text-primary disabled:opacity-50"

  return (
    <PageBox icon={WalletCards} title={t("oldStatement.title")} subtitle={t("oldStatement.subtitle")}
      action={<div className="flex items-center gap-4 text-sm font-medium">
            <button type="button" className={link} disabled={!rows.length} onClick={() => printReport(output)}><Printer size={16} /><span className="hidden sm:inline">{t("oldStatement.print")}</span></button>
            <button type="button" className={link} disabled={!rows.length || pdfBusy} onClick={pdf}><FileText size={16} /><span className="hidden sm:inline">{pdfBusy ? t("oldStatement.loading") : "PDF"}</span></button>
            <button type="button" className={link} disabled={!rows.length} onClick={() => excelReport(output)}><FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span></button>
      </div>}>

      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5 print:hidden">
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

        <DataTable rows={rows} loading={isFetching && !!applied.treasuryId} columns={columns} sort={sort} rowKey={(r) => `${r.documentNumber}-${r.date}-${r.balance}`} searchPlaceholder={t("oldStatement.search")}
          emptyText={t("oldStatement.empty")} empty={null} />
      </div>
    </PageBox>
  )
}
