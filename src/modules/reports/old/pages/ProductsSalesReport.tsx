import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Barcode, DollarSign } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { currentBranchId } from "@/modules/partners/mappers"
import { productsSales, type ProductsSalesRow } from "../api"
import { excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

const PAGE = 10

/** What each item sold between two dates, laid out as in the current system. The server sorts; the rows are paged here. */
export default function ProductsSalesReport() {
  const { t } = useTranslation()
  const f = useFiscalFilters()
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "salesCount", desc: true })
  const [page, setPage] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const { data, isFetching } = useQuery({
    queryKey: ["old-reports", "products-sales", f.applied, sort],
    queryFn: () => productsSales({ branchid: currentBranchId(), from: f.applied.from, to: f.applied.to, SortBy: sort.key, SortDescending: sort.desc }),
    enabled: f.searched,
  })
  const rows = f.searched ? data?.details ?? [] : []
  const totalSales = data?.summary?.grandTotalSales ?? rows.reduce((s, r) => s + (r.totalSales || 0), 0)

  const cards: SummaryCard[] = f.searched && !isFetching ? [{ title: t("oldReports.total_sales"), value: money(totalSales), suffix: t("oldReports.sar"), icon: DollarSign, color: "orange" }] : []

  const title = t("oldReports.products_sales_report")
  const out: ReportOutput<ProductsSalesRow> = {
    title, cards, rows,
    filters: `${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`,
    columns: [
      { header: t("oldReports.serial"), value: (_, i) => i + 1 },
      { header: t("oldReports.product_name"), value: (r) => r.productName },
      { header: t("oldReports.barcode"), value: (r) => r.barcode },
      { header: t("oldReports.sales_count"), value: (r) => r.salesCount },
      { header: t("oldReports.total_sales"), value: (r) => money(r.totalSales) },
    ],
  }
  const run = (fn: (o: typeof out) => unknown) => () => rows.length > 0 && fn(out)

  const first = page * PAGE
  const columns: Column<ProductsSalesRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => rows.indexOf(r) + 1 },
    { id: "barcode", header: t("oldReports.barcode"), cell: (r) => <span className="font-mono text-xs">{r.barcode}</span> },
    { id: "name", header: t("oldReports.product_name"), cell: (r) => <span className="font-bold">{r.productName}</span> },
    { id: "count", sortKey: "salesCount", header: t("oldReports.sales_count"), cell: (r) => r.salesCount },
    { id: "total", header: t("oldReports.total_sales"), cell: (r) => <span className="font-bold text-primary">{money(r.totalSales)}</span> },
  ]

  return (
    <ReportShell title={title} icon={Barcode} onPrint={run(printReport)} onExcel={run(excelReport)} pdfBusy={pdfBusy}
      onPdf={() => { if (rows.length) { setPdfBusy(true); Promise.resolve(pdfReport(out)).finally(() => setPdfBusy(false)) } }}>
      <SummaryCards cards={cards} />
      <FiscalFilters withFiscal={false} loading={isFetching} f={{ ...f, search: () => { f.search(); setPage(0) }, clear: () => { f.clear(); setPage(0) } }} />
      <ReportTable rows={rows.slice(first, first + PAGE)} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.barcode || r.productName}
        server={{ total: rows.length, page, pageSize: PAGE, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
