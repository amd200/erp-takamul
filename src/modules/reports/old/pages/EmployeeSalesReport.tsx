import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DollarSign, Receipt, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployees } from "@/modules/lookups/service"
import { fullName } from "@/modules/lookups/types"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { employeeSales, type EmployeeSaleRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

const ALL = "all"

/** The invoices one employee served between two dates, laid out as in the current system. The server pages and sorts. */
export default function EmployeeSalesReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const size = Number(useAppSettings().generalTab?.rowsPerPage) || 10
  const { data: employees = [] } = useEmployees()
  const f = useFiscalFilters()
  const [employee, setEmployee] = useState(ALL)
  const [applied, setApplied] = useState(ALL)
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "orderDate", desc: true })
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const query = (Page: number, PageSize: number) => employeeSales({ BranchId: currentBranchId(), From: f.applied.from, To: f.applied.to, Page, PageSize, EmployeeId: applied === ALL ? undefined : applied, SortBy: sort.key, SortDescending: sort.desc })
  const { data, isFetching } = useQuery({ queryKey: ["old-reports", "employee-sales", f.applied, applied, sort, page, size], queryFn: () => query(page + 1, size), enabled: f.searched, placeholderData: (p) => p })
  const rows = f.searched ? data?.items ?? [] : []
  const sar = t("oldReports.sar")

  const cards: SummaryCard[] = [
    { title: t("oldReports.total_invoices"), value: String(data?.totalInvoices ?? 0), color: "blue", icon: Receipt },
    { title: t("oldReports.total_sales"), value: money(data?.totalSales), suffix: sar, color: "teal", icon: DollarSign },
  ]

  const title = t("oldReports.employee_sales_report")
  const columnsOut: ReportOutput<EmployeeSaleRow>["columns"] = [
    { header: t("oldReports.serial"), value: (_, i) => i + 1 },
    { header: t("oldReports.employee_name"), value: (r) => r.employeeName },
    { header: t("oldReports.order_number"), value: (r) => r.orderNumber },
    { header: t("oldReports.date"), value: (r) => dayText(r.orderDate) },
    { header: t("oldReports.customer_name"), value: (r) => r.customerName },
    { header: t("oldReports.total_amount"), value: (r) => money(r.grandTotal) },
    { header: t("oldReports.payment_status"), value: (r) => r.paymentStatus },
  ]
  const filters = `${t("oldReports.employee")}: ${applied === ALL ? t("oldReports.all") : fullName(employees.find((e) => String(e.id) === applied) ?? {})} | ${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`
  const all = async () => {
    const out: EmployeeSaleRow[] = []
    for (let p = 1; p <= 50; p++) { const r = await query(p, 200); out.push(...r.items); if (!r.items.length || out.length >= r.totalCount) break }
    return out
  }
  const exportWith = (fn: (o: ReportOutput<EmployeeSaleRow>) => unknown) => async () => {
    if (!rows.length) return
    setBusy(true)
    try { await fn({ title, cards, filters, columns: columnsOut, rows: await all() }) } finally { setBusy(false) }
  }

  const columns: Column<EmployeeSaleRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => page * size + rows.indexOf(r) + 1 },
    { id: "employee", sortKey: "employeeName", header: t("oldReports.employee_name"), cell: (r) => <span className="whitespace-nowrap">{r.employeeName}</span> },
    { id: "number", sortKey: "orderNumber", header: t("oldReports.invoice_number"), cell: (r) => <span className="font-bold whitespace-nowrap text-[#22c55e]">{r.orderNumber}</span> },
    { id: "date", sortKey: "orderDate", header: t("oldReports.date"), cell: (r) => <span className="whitespace-nowrap">{dayText(r.orderDate)}</span> },
    { id: "customer", header: t("oldReports.customer_name"), cell: (r) => <span className="whitespace-nowrap">{r.customerName}</span> },
    ...(!exempt ? [
      { id: "sub", header: t("oldReports.sub_total"), cell: (r: EmployeeSaleRow) => <span className="whitespace-nowrap">{money(r.subTotal)}</span> },
      { id: "tax", header: t("oldReports.tax_amount"), cell: (r: EmployeeSaleRow) => <span className="whitespace-nowrap">{money(r.taxAmount)}</span> },
    ] : []),
    { id: "total", sortKey: "grandTotal", header: t("oldReports.grand_total"), cell: (r) => <span className="font-bold whitespace-nowrap">{money(r.grandTotal)}</span> },
  ]

  const employeeFilter = (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{t("oldReports.employee")}</Label>
      <Select value={employee} onValueChange={setEmployee}>
        <SelectTrigger className="w-full"><SelectValue placeholder={t("oldReports.select_employee")} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("oldReports.all")}</SelectItem>
          {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{fullName(e)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <ReportShell title={title} icon={Users} onPrint={exportWith(printReport)} onExcel={exportWith(excelReport)} pdfBusy={busy} onPdf={exportWith(pdfReport)}>
      <SummaryCards cards={cards} />
      <FiscalFilters withFiscal={false} extra={employeeFilter} loading={isFetching}
        f={{ ...f, search: () => { setApplied(employee); f.search(); setPage(0) }, clear: () => { setEmployee(ALL); setApplied(ALL); f.clear(); setPage(0) } }} />
      <ReportTable rows={rows} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.orderNumber} pageSize={size}
        server={{ total: f.searched ? data?.totalCount ?? 0 : 0, page, pageSize: size, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
