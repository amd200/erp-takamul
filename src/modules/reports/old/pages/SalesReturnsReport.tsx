import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Receipt, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { salesReturns, type SalesReturnRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

/** Sales returns between two dates, laid out as in the current system. The server pages and sorts. */
export default function SalesReturnsReport() {
  const { t } = useTranslation()
  const size = Number(useAppSettings().generalTab?.rowsPerPage) || 10
  const f = useFiscalFilters()
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "returnDate", desc: true })
  const [page, setPage] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const query = (Page: number, PageSize: number) => salesReturns({ BranchId: currentBranchId(), From: f.applied.from, To: f.applied.to, Page, PageSize, SortBy: sort.key, SortDescending: sort.desc })
  const { data, isFetching } = useQuery({ queryKey: ["old-reports", "sales-returns", f.applied, sort, page, size], queryFn: () => query(page + 1, size), enabled: f.searched, placeholderData: (p) => p })
  const rows = f.searched ? data?.items ?? [] : []

  const cards: SummaryCard[] = [
    { title: t("oldReports.total_returns"), value: money(data?.totalGrand), suffix: t("oldReports.sar"), color: "red", icon: RotateCcw },
    { title: t("oldReports.total_invoices"), value: (data?.totalInvoices ?? 0).toLocaleString("en-US"), color: "blue", icon: Receipt },
  ]

  const title = t("oldReports.sales_returns_report")
  const columnsOut: ReportOutput<SalesReturnRow>["columns"] = [
    { header: t("oldReports.serial"), value: (_, i) => i + 1 },
    { header: t("oldReports.date"), value: (r) => dayText(r.returnDate) },
    { header: t("oldReports.return_number"), value: (r) => r.returnNumber },
    { header: t("oldReports.sales_invoice_number"), value: (r) => r.salesOrderNumber },
    { header: t("oldReports.total_amount"), value: (r) => money(r.grandTotal) },
    { header: t("oldReports.refunded_amount"), value: (r) => money(r.refundedAmount) },
  ]
  const filters = `${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`
  // The export carries every page, not only the one on screen.
  const all = async () => {
    const out: SalesReturnRow[] = []
    for (let p = 1; p <= 50; p++) { const r = await query(p, 200); out.push(...r.items); if (!r.items.length || out.length >= r.totalCount) break }
    return out
  }
  const exportWith = (fn: (o: ReportOutput<SalesReturnRow>) => unknown) => async () => {
    if (!rows.length) return
    setPdfBusy(true)
    try { await fn({ title, cards, filters, columns: columnsOut, rows: await all() }) } finally { setPdfBusy(false) }
  }

  const columns: Column<SalesReturnRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{page * size + rows.indexOf(r) + 1}</span> },
    { id: "date", sortKey: "returnDate", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.returnDate)}</span> },
    { id: "number", sortKey: "returnNumber", header: t("oldReports.return_number"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{r.returnNumber}</span> },
    { id: "invoice", header: t("oldReports.sales_invoice_number"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{r.salesOrderNumber}</span> },
    { id: "total", sortKey: "grandTotal", header: t("oldReports.total_amount"), cell: (r) => <span dir="ltr" className="text-sm font-bold text-primary">{money(r.grandTotal)}</span> },
    { id: "refunded", header: t("oldReports.refunded_amount"), cell: (r) => <span dir="ltr" className="text-sm font-bold">{money(r.refundedAmount)}</span> },
  ]

  return (
    <ReportShell title={title} icon={RotateCcw} onPrint={exportWith(printReport)} onExcel={exportWith(excelReport)} pdfBusy={pdfBusy} onPdf={exportWith(pdfReport)}>
      <SummaryCards cards={cards} />
      <FiscalFilters withFiscal={false} loading={isFetching} f={{ ...f, search: () => { f.search(); setPage(0) }, clear: () => { f.clear(); setPage(0) } }} />
      <ReportTable rows={rows} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.returnId} pageSize={size}
        server={{ total: f.searched ? data?.totalCount ?? 0 : 0, page, pageSize: size, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
