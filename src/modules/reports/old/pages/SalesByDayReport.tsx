import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, DollarSign, Percent, Receipt, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { dailySales, type DailySalesRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

const PAGE = 10

/** Sales totals by day, laid out as in the current system. The server sorts; the rows are paged here. */
export default function SalesByDayReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const f = useFiscalFilters()
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "date", desc: true })
  const [page, setPage] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const { data, isFetching } = useQuery({
    queryKey: ["old-reports", "sales-by-day", f.applied, sort],
    queryFn: () => dailySales({ branchid: currentBranchId(), From: f.applied.from, To: f.applied.to, SortBy: sort.key, SortDescending: sort.desc }),
    enabled: f.searched,
  })
  const rows = f.searched ? data?.data ?? [] : []
  const totals = f.searched ? data?.totals : undefined
  const sar = t("oldReports.sar")

  const cards: SummaryCard[] = [
    { title: t("oldReports.total_invoices"), value: (totals?.totalInvoices ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" },
    ...(!exempt ? [
      { title: t("oldReports.total_sales_excl_tax"), value: money(totals?.totalSales), suffix: sar, icon: TrendingUp, color: "orange" as const },
      { title: t("oldReports.total_tax"), value: money(totals?.totalTax), suffix: sar, icon: Receipt, color: "blue" as const },
    ] : []),
    { title: t("oldReports.total_discount"), value: money(totals?.totalDiscount), suffix: sar, icon: Percent, color: "purple" },
    { title: t("oldReports.grand_total_with_tax"), value: money(totals?.netSales), suffix: sar, icon: DollarSign, color: "teal" },
  ]

  const title = t("oldReports.sales_by_day")
  const out: ReportOutput<DailySalesRow> = {
    title, cards, rows,
    filters: `${t("oldReports.fiscal_year")}: ${f.applied.fiscalYear} | ${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`,
    columns: [
      { header: t("oldReports.serial"), value: (_, i) => i + 1 },
      { header: t("oldReports.date"), value: (r) => dayText(r.date) },
      ...(!exempt ? [{ header: t("oldReports.total_sales_excl_tax"), value: (r: DailySalesRow) => money(r.totalSales) }, { header: t("oldReports.total_tax"), value: (r: DailySalesRow) => money(r.totalTax) }] : []),
      { header: t("oldReports.grand_total_with_tax"), value: (r) => money(r.netSales) },
    ],
  }
  const run = (fn: (o: typeof out) => unknown) => () => rows.length > 0 && fn(out)

  const first = page * PAGE
  const columns: Column<DailySalesRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{rows.indexOf(r) + 1}</span> },
    { id: "date", sortKey: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm font-bold">{dayText(r.date)}</span> },
    ...(!exempt ? [
      { id: "sales", sortKey: "totalSales", header: t("oldReports.total_sales_excl_tax"), cell: (r: DailySalesRow) => <span className="text-sm font-medium">{money(r.totalSales)}</span> },
      { id: "tax", sortKey: "totalTax", header: t("oldReports.total_tax"), cell: (r: DailySalesRow) => <span className="text-sm">{money(r.totalTax)}</span> },
    ] : []),
    { id: "net", sortKey: "netSales", header: t("oldReports.grand_total_with_tax"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.netSales)}</span> },
  ]

  return (
    <ReportShell title={title} icon={Calendar} onPrint={run(printReport)} onExcel={run(excelReport)} pdfBusy={pdfBusy}
      onPdf={() => { if (rows.length) { setPdfBusy(true); Promise.resolve(pdfReport(out)).finally(() => setPdfBusy(false)) } }}>
      <SummaryCards cards={cards} />
      <FiscalFilters f={{ ...f, search: () => { f.search(); setPage(0) }, clear: () => { f.clear(); setPage(0) } }} loading={isFetching} />
      <ReportTable rows={rows.slice(first, first + PAGE)} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.date}
        server={{ total: rows.length, page, pageSize: PAGE, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
