import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, DollarSign, FileText, Percent, Receipt, TrendingUp, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { salesInvoices, type SalesInvoiceRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

const PAGE = 10

/** Sales totals by invoice number, laid out as in the current system. The server sorts; the rows are paged here. */
export default function SalesByInvoiceReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const f = useFiscalFilters()
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "date", desc: true })
  const [page, setPage] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const { data, isFetching } = useQuery({
    queryKey: ["old-reports", "sales-by-invoice", f.applied, sort],
    queryFn: () => salesInvoices({ branchid: currentBranchId(), From: f.applied.from, To: f.applied.to, SortBy: sort.key, SortDescending: sort.desc }),
    enabled: f.searched,
  })
  const rows = f.searched ? data?.data ?? [] : []
  const totals = f.searched ? data?.totals : undefined
  const totalTax = (totals?.finalTotal ?? 0) - (totals?.totalSubTotal ?? 0)
  const sar = t("oldReports.sar")

  const cards: SummaryCard[] = [
    { title: t("oldReports.total_invoices"), value: (totals?.totalInvoices ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" },
    ...(!exempt ? [
      { title: t("oldReports.total_sales_excl_tax"), value: money(totals?.totalSubTotal), suffix: sar, icon: TrendingUp, color: "orange" as const },
      { title: t("oldReports.total_tax"), value: money(totalTax), suffix: sar, icon: Receipt, color: "blue" as const },
    ] : []),
    { title: t("oldReports.total_discount"), value: money(totals?.totalDiscount), suffix: sar, icon: Percent, color: "purple" },
    { title: t("oldReports.grand_total_with_tax"), value: money(totals?.finalTotal), suffix: sar, icon: DollarSign, color: "teal" },
    { title: t("oldReports.total_paid"), value: money(totals?.totalPaid), suffix: sar, icon: Wallet, color: "green" },
    { title: t("oldReports.total_remaining"), value: money(totals?.totalRemaining), suffix: sar, icon: CreditCard, color: "red" },
  ]

  const title = t("oldReports.sales_by_invoice")
  const out: ReportOutput<SalesInvoiceRow> = {
    title, cards, rows,
    filters: `${t("oldReports.fiscal_year")}: ${f.applied.fiscalYear} | ${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`,
    columns: [
      { header: t("oldReports.serial"), value: (_, i) => i + 1 },
      { header: t("oldReports.date"), value: (r) => dayText(r.date) },
      { header: t("oldReports.invoice_number"), value: (r) => r.orderNumber },
      ...(!exempt ? [{ header: t("oldReports.total_sales_excl_tax"), value: (r: SalesInvoiceRow) => money(r.subTotal) }, { header: t("oldReports.tax"), value: (r: SalesInvoiceRow) => money(r.grandTotal - r.subTotal) }] : []),
      { header: t("oldReports.grand_total_with_tax"), value: (r) => money(r.grandTotal) },
    ],
  }
  const run = (fn: (o: typeof out) => unknown) => () => rows.length > 0 && fn(out)

  const first = page * PAGE
  const columns: Column<SalesInvoiceRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{rows.indexOf(r) + 1}</span> },
    { id: "date", sortKey: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.date)}</span> },
    { id: "number", sortKey: "orderNumber", header: t("oldReports.invoice_number"), cell: (r) => <span className="text-sm font-bold">{r.orderNumber}</span> },
    ...(!exempt ? [
      { id: "sub", sortKey: "subTotal", header: t("oldReports.total_sales_excl_tax"), cell: (r: SalesInvoiceRow) => <span className="text-sm font-medium">{money(r.subTotal)}</span> },
      { id: "tax", header: t("oldReports.tax"), cell: (r: SalesInvoiceRow) => <span className="text-sm">{money(r.grandTotal - r.subTotal)}</span> },
    ] : []),
    { id: "total", sortKey: "grandTotal", header: t("oldReports.grand_total_with_tax"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.grandTotal)}</span> },
  ]

  return (
    <ReportShell title={title} icon={FileText} onPrint={run(printReport)} onExcel={run(excelReport)} pdfBusy={pdfBusy}
      onPdf={() => { if (rows.length) { setPdfBusy(true); Promise.resolve(pdfReport(out)).finally(() => setPdfBusy(false)) } }}>
      <SummaryCards cards={cards} />
      <FiscalFilters f={{ ...f, search: () => { f.search(); setPage(0) }, clear: () => { f.clear(); setPage(0) } }} loading={isFetching} />
      <ReportTable rows={rows.slice(first, first + PAGE)} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.orderNumber}
        server={{ total: rows.length, page, pageSize: PAGE, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
