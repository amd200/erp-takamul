import { TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { profitReport } from "../api"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

type Line = { id: string; label: string; value: number; strong?: boolean }

/** Profit between two dates as a short statement (sales, cost, gross profit, expenses, net profit), laid out as in the current system. */
export default function ProfitReport() {
  const { t } = useTranslation()
  const lines = (r: Awaited<ReturnType<typeof profitReport>>): Line[] => [
    { id: "sales", label: t("oldReports.total_sales"), value: r.totalSales },
    { id: "cost", label: t("oldReports.cost_of_total_sales"), value: r.totalCost },
    { id: "gross", label: t("oldReports.gross_profit"), value: r.grossProfit, strong: true },
    { id: "expenses", label: t("oldReports.total_expenses"), value: r.totalExpenses },
    { id: "net", label: t("oldReports.net_profit"), value: r.netProfit, strong: true },
  ]
  return (
    <PagedReport<Line, Awaited<ReturnType<typeof profitReport>>>
      id="profit" title={t("oldReports.profit_report")} icon={TrendingUp} withFiscal exportAll={false}
      filterText={(a) => `${t("oldReports.fiscal_year")}: ${a.fiscalYear} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a) => profitReport({ branchid: currentBranchId(), from: a.from, to: a.to })}
      rowsOf={lines} totalOf={(r) => lines(r).length} rowKey={(r) => r.id} cards={() => []}
      columns={[
        { id: "label", header: t("oldReports.item"), cell: (r) => <span className={r.strong ? "text-sm font-bold" : "text-sm"}>{r.label}</span> },
        { id: "value", header: t("oldReports.amount"), cell: (r) => <span className={r.strong ? "text-sm font-bold text-primary" : "text-sm"}>{money(r.value)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.item"), value: (r) => r.label },
        { header: t("oldReports.amount"), value: (r) => money(r.value) },
      ]} />
  )
}
