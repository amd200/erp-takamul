import { useState } from "react"
import { DollarSign, Receipt, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useEmployees } from "@/modules/lookups/service"
import { fullName } from "@/modules/lookups/types"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { employeeSales, type EmployeeSaleRow } from "../api"
import { money } from "../output"
import { PagedReport, slice } from "../PagedReport"
import { ALL, SelectFilter } from "../SelectFilter"

/** What each employee sold between two dates, laid out as in the current system. The server sends one row per employee; they are paged here. */
export default function EmployeeSalesReport() {
  const { t } = useTranslation()
  const { data: employees = [] } = useEmployees()
  const [employee, setEmployee] = useState(ALL)
  const [applied, setApplied] = useState(ALL)
  const sar = t("oldReports.sar")
  const name = applied === ALL ? t("oldReports.all") : fullName(employees.find((e) => String(e.id) === applied) ?? {})
  const filter = (
    <SelectFilter label={t("oldReports.employee")} value={employee} onChange={setEmployee} placeholder={t("oldReports.select_employee")} all
      options={employees.map((e) => ({ value: String(e.id), label: fullName(e) }))} />
  )
  return (
    <PagedReport<EmployeeSaleRow, { rows: EmployeeSaleRow[]; all: Awaited<ReturnType<typeof employeeSales>> }>
      id="employee-sales" title={t("oldReports.employee_sales_report")} icon={Users} extra={filter} dep={applied}
      onSearch={() => setApplied(employee)} onClear={() => { setEmployee(ALL); setApplied(ALL) }}
      filterText={(a) => `${t("oldReports.employee")}: ${name} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={async (a, page, size) => {
        const all = await employeeSales({ BranchId: currentBranchId(), From: a.from, To: a.to, EmployeeId: applied === ALL ? undefined : applied })
        return { rows: slice(all.items, page, size), all }
      }}
      rowsOf={(r) => r.rows} totalOf={(r) => r.all.items.length} rowKey={(r) => r.employeeId}
      cards={(r) => [
        { title: t("oldReports.total_invoices"), value: String(r?.all.summary.totalInvoices ?? 0), color: "blue", icon: Receipt },
        { title: t("oldReports.total_sales"), value: money(r?.all.summary.totalSales), suffix: sar, color: "teal", icon: DollarSign },
        { title: t("oldReports.total_returns"), value: money(r?.all.summary.totalReturns), suffix: sar, color: "red", icon: Receipt },
        { title: t("oldReports.net_sales"), value: money(r?.all.summary.netSales), suffix: sar, color: "green", icon: DollarSign },
      ]}
      columns={[
        { id: "employee", header: t("oldReports.employee_name"), cell: (r) => <span className="whitespace-nowrap">{r.employeeName}</span> },
        { id: "branch", header: t("oldReports.branch"), cell: (r) => r.branchName },
        { id: "count", header: t("oldReports.total_invoices"), cell: (r) => r.invoicesCount },
        { id: "sales", header: t("oldReports.total_sales"), cell: (r) => <span className="whitespace-nowrap">{money(r.totalSales)}</span> },
        { id: "returns", header: t("oldReports.total_returns"), cell: (r) => <span className="whitespace-nowrap">{money(r.totalReturns)}</span> },
        { id: "net", header: t("oldReports.net_sales"), cell: (r) => <span className="font-bold whitespace-nowrap">{money(r.netSales)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.employee_name"), value: (r) => r.employeeName },
        { header: t("oldReports.branch"), value: (r) => r.branchName },
        { header: t("oldReports.total_invoices"), value: (r) => r.invoicesCount },
        { header: t("oldReports.total_sales"), value: (r) => money(r.totalSales) },
        { header: t("oldReports.total_returns"), value: (r) => money(r.totalReturns) },
        { header: t("oldReports.net_sales"), value: (r) => money(r.netSales) },
      ]} />
  )
}
