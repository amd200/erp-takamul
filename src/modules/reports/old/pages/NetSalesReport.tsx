import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, DollarSign, FileText, RotateCcw, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { useAppSettings } from "@/modules/settings"
import { netSales, type NetSalesRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { reportKeys } from "../../keys"

type DocType = "all" | "Sales" | "SalesReturn"
const day = (d: Date) => d.toLocaleDateString("en-CA")
const initial = () => { const now = new Date(); return { from: day(new Date(now.getFullYear(), now.getMonth(), 1)), to: day(now), type: "all" as DocType } }

/** Sales net of returns, listing both kinds of document, laid out as in the current system. The server pages and sorts. */
export default function NetSalesReport() {
  const { t } = useTranslation()
  const size = Number(useAppSettings().generalTab?.rowsPerPage) || 10
  const [filters, setFilters] = useState(initial)
  const [params, setParams] = useState<ReturnType<typeof initial> | null>(null)
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "date", desc: true })
  const [page, setPage] = useState(0)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const query = (Page: number, PageSize: number) => netSales({ BranchId: currentBranchId(), From: params!.from, To: params!.to, Type: params!.type === "all" ? undefined : params!.type, Page, PageSize, SortBy: sort.key, SortDescending: sort.desc })
  const { data, isFetching, isError } = useQuery({ queryKey: reportKeys.netSales(params, sort, page, size), queryFn: () => query(page + 1, size), enabled: !!params, placeholderData: (p) => p })
  const rows = params ? data?.items ?? [] : []
  const sar = t("oldReports.sar")
  const typeLabel = (v?: string) => (v === "Sales" ? t("oldReports.sales_invoice") : v === "SalesReturn" ? t("oldReports.sales_return") : t("oldReports.all_documents"))

  const cards: SummaryCard[] = [
    { title: t("oldReports.total_sales"), value: money(data?.totalSales), suffix: sar, icon: DollarSign, color: "teal" },
    { title: t("oldReports.total_returns"), value: money(data?.totalReturns), suffix: sar, icon: RotateCcw, color: "red" },
    { title: t("oldReports.net_sales"), value: money(data?.totalNet), suffix: sar, icon: BarChart3, color: (data?.totalNet ?? 0) < 0 ? "red" : "green" },
  ]

  const title = t("oldReports.net_sales_report")
  const columnsOut: ReportOutput<NetSalesRow>["columns"] = [
    { header: t("oldReports.serial"), value: (_, i) => i + 1 },
    { header: t("oldReports.date"), value: (r) => dayText(r.date) },
    { header: t("oldReports.invoice_number"), value: (r) => r.number },
    { header: t("oldReports.document_type"), value: (r) => typeLabel(r.type) },
    { header: t("oldReports.grand_total"), value: (r) => money(r.netAmount) },
  ]
  const exportWith = (fn: (o: ReportOutput<NetSalesRow>) => unknown) => async () => {
    if (!params || !rows.length) return
    setBusy(true)
    try {
      const all: NetSalesRow[] = []
      for (let p = 1; p <= 50; p++) { const r = await query(p, 200); all.push(...r.items); if (!r.items.length || all.length >= r.totalCount) break }
      await fn({ title, cards, filters: `${t("oldReports.from")}: ${params.from} | ${t("oldReports.to")}: ${params.to} | ${typeLabel(params.type)}`, columns: columnsOut, rows: all })
    } catch { setError(t("oldReports.export_failed")) } finally { setBusy(false) }
  }

  const search = () => {
    if (!filters.from || !filters.to || filters.from > filters.to) return setError(t("oldReports.invalid_range"))
    setError(""); setPage(0); setParams(filters)
  }
  const columns: Column<NetSalesRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{page * size + rows.indexOf(r) + 1}</span> },
    { id: "date", sortable: true, header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.date)}</span> },
    { id: "number", sortable: true, header: t("oldReports.invoice_number"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{r.number}</span> },
    { id: "type", header: t("oldReports.document_type"), cell: (r) => <span className={`text-sm font-medium ${r.type === "SalesReturn" ? "text-red-500" : "text-primary"}`}>{typeLabel(r.type)}</span> },
    { id: "netAmount", sortable: true, header: t("oldReports.grand_total"), cell: (r) => <span dir="ltr" className={`text-sm font-bold ${r.type === "SalesReturn" ? "text-red-500" : ""}`}>{r.type === "SalesReturn" ? "-" : ""}{money(r.netAmount)}</span> },
  ]

  return (
    <ReportShell title={title} icon={FileText} onPrint={exportWith(printReport)} onExcel={exportWith(excelReport)} pdfBusy={busy} onPdf={exportWith(pdfReport)}>
      <SummaryCards cards={cards} />
      <form onSubmit={(e) => { e.preventDefault(); search() }} className="grid grid-cols-1 items-end gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:p-5 dark:bg-slate-900/40">
        <div className="grid min-w-0 gap-2"><Label className="text-xs font-semibold text-slate-500">{t("oldReports.from_date")}</Label><DatePicker className="h-11" value={filters.from} onChange={(v) => setFilters((p) => ({ ...p, from: v }))} /></div>
        <div className="grid min-w-0 gap-2"><Label className="text-xs font-semibold text-slate-500">{t("oldReports.to_date")}</Label><DatePicker className="h-11" value={filters.to} onChange={(v) => setFilters((p) => ({ ...p, to: v }))} /></div>
        <div className="grid min-w-0 gap-2">
          <Label className="text-xs font-semibold text-slate-500">{t("oldReports.document_type")}</Label>
          <Select value={filters.type} onValueChange={(v) => setFilters((p) => ({ ...p, type: v as DocType }))}>
            <SelectTrigger className="h-11! w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{typeLabel()}</SelectItem><SelectItem value="Sales">{typeLabel("Sales")}</SelectItem><SelectItem value="SalesReturn">{typeLabel("SalesReturn")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isFetching} className="h-11 flex-1 gap-2 rounded-lg px-6 font-semibold lg:min-w-32 lg:flex-none"><Search size={16} />{isFetching ? t("oldReports.loading") : t("oldReports.search")}</Button>
          <Button type="button" variant="outline" aria-label={t("oldReports.reset")} className="h-11 w-11 p-0" onClick={() => { setFilters(initial()); setParams(null); setPage(0); setError("") }}><RotateCcw size={16} /></Button>
        </div>
      </form>
      {(error || isError) && <p role="alert" className="text-sm text-red-600">{error || t("common.loadFailed")}</p>}
      {params && data && <p className="text-sm text-muted-foreground">{t("oldReports.total_invoices")}: {data.totalCount}</p>}
      <ReportTable rows={rows} columns={columns} loading={isFetching} searched={!!params} rowKey={(r) => `${r.type}-${r.id}`} pageSize={size}
        server={{ total: params ? data?.totalCount ?? 0 : 0, page, pageSize: size, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
