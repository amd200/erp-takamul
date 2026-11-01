import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileSpreadsheet, Printer, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ReportFilters, presetRange, type Preset } from "@/modules/reports/components/ReportFilters"
import { ReportTable } from "@/modules/reports/components/ReportTable"
import { downloadCsv } from "@/modules/reports/export"
import type { Filters, ReportResult } from "@/modules/reports/types"
import { useStatement, useTreasuryList } from "../queries"

/** Every movement in one treasury with a running balance, like a bank statement. */
export default function TreasuryStatementModern() {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { data: treasuries = [] } = useTreasuryList()
  const treasuryId = Number(params.get("treasury")) || treasuries[0]?.id
  const [preset, setPreset] = useState<Preset>("thisMonth")
  const [period, setPeriod] = useState<Filters>(presetRange("thisMonth"))
  const { data: moves = [], isLoading } = useStatement(treasuryId, period.from, period.to)
  const treasury = treasuries.find((x) => x.id === treasuryId)

  const result = useMemo<ReportResult | null>(() => {
    if (!treasury) return null
    // The server returns the running balance per row; the balance before the first row is what is left after backing it out.
    const first = moves[0]
    const opening = first ? Math.round((first.balance - first.incomingAmount + first.outgoingAmount) * 100) / 100 : treasury.currentBalance ?? 0
    const rows = moves.map((m) => ({ date: m.date, type: { text: m.documentType, tone: m.incomingAmount > 0 ? "good" as const : "muted" as const }, doc: m.documentNumber, desc: m.description || "—", in: m.incomingAmount > 0 ? m.incomingAmount : null, out: m.outgoingAmount > 0 ? m.outgoingAmount : null, balance: m.balance }))
    const balance = moves.length ? moves[moves.length - 1].balance : opening
    const totalIn = rows.reduce((s, r) => s + (r.in ?? 0), 0), totalOut = rows.reduce((s, r) => s + (r.out ?? 0), 0)
    return {
      stats: [{ id: "opening", value: opening, kind: "money" }, { id: "qtyIn", value: totalIn, kind: "money", tone: "good" }, { id: "qtyOut", value: totalOut, kind: "money", tone: "bad" }, { id: "closing", value: balance, kind: "money" }],
      columns: [{ id: "date", kind: "date" }, { id: "type", kind: "badge" }, { id: "doc", kind: "text", strong: true }, { id: "desc", kind: "text" }, { id: "in", kind: "money" }, { id: "out", kind: "money" }, { id: "balance", kind: "money", strong: true }],
      rows, totals: { date: "", in: totalIn, out: totalOut, balance },
    }
  }, [moves, treasury])

  const choosePreset = (p: Preset) => { setPreset(p); if (p !== "custom") setPeriod(presetRange(p)) }
  const statLabel = (id: string) => t(id === "qtyIn" ? "treasuries.totalIn" : id === "qtyOut" ? "treasuries.totalOut" : `reports.k.${id}`)

  return (
    <>
      <PageHeader crumbs={[t("nav.treasuries")]} title={t("treasuries.statementTitle")} description={treasury?.name}
        actions={result && (
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="lg" onClick={() => downloadCsv(`treasury-${treasuryId}-${period.from}-${period.to}`, result, t, i18n.language)}><FileSpreadsheet />{t("reports.excel")}</Button>
            <Button variant="outline" size="lg" onClick={() => window.print()}><Printer />{t("reports.print")}</Button>
          </div>
        )} />
      <Card className="print:hidden"><CardContent className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:w-56">
          <FieldLabel htmlFor="treasury">{t("sales.treasury")}</FieldLabel>
          <Select value={treasuryId ? String(treasuryId) : undefined} onValueChange={(v) => setParams({ treasury: v })}>
            <SelectTrigger id="treasury" className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{treasuries.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <ReportFilters keys={["period"]} required={[]} value={period} preset={preset} onChange={setPeriod} onPreset={choosePreset} />
      </CardContent></Card>

      {isLoading || !result ? <div className="h-72 animate-pulse rounded-xl bg-muted" /> : (
        <>
          {result.rows.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {result.stats.map((s) => (
              <div key={s.id} className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
                <span className="text-xs text-muted-foreground">{statLabel(s.id)}</span>
                <span className={cn("text-lg font-semibold tabular-nums", s.tone === "good" && "text-success", s.tone === "bad" && "text-destructive")}>{formatMoney(s.value)}</span>
              </div>
            ))}
          </div>}
          <Card><CardContent>
            {result.rows.length === 0
              ? <EmptyState icon={<SearchX />} title={t("reports.noRows")} hint={t("reports.noRowsHint")} />
              : <ReportTable columns={result.columns} rows={result.rows} totals={result.totals} />}
          </CardContent></Card>
        </>
      )}
    </>
  )
}
