import { Calendar, DollarSign, Percent, Receipt, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/modules/partners/mappers"
import { useAppSettings } from "@/modules/settings"
import { dailySales, type DailySalesRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"

/** Sales totals by day, laid out as in the current system. */
export default function SalesByDayReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const sar = t("oldReports.sar")
  return (
    <PagedReport<DailySalesRow, Awaited<ReturnType<typeof dailySales>>>
      id="sales-by-day" title={t("oldReports.sales_by_day")} icon={Calendar} withFiscal defaultSort={{ key: "date", desc: true }}
      filterText={(a) => `${t("oldReports.fiscal_year")}: ${a.fiscalYear} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size, s) => dailySales({ branchid: currentBranchId(), from: a.from, to: a.to, Page: page, PageSize: size, SortBy: s.key, SortDescending: s.desc })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.date}
      cards={(r) => [
        { title: t("oldReports.total_invoices"), value: (r?.totals.totalInvoices ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" },
        ...(!exempt ? [
          { title: t("oldReports.total_sales_excl_tax"), value: money(r?.totals.totalSales), suffix: sar, icon: TrendingUp, color: "orange" as const },
          { title: t("oldReports.total_tax"), value: money(r?.totals.totalTax), suffix: sar, icon: Receipt, color: "blue" as const },
        ] : []),
        { title: t("oldReports.total_discount"), value: money(r?.totals.totalDiscount), suffix: sar, icon: Percent, color: "purple" },
        { title: t("oldReports.grand_total_with_tax"), value: money(r?.totals.netSales), suffix: sar, icon: DollarSign, color: "teal" },
      ]}
      columns={[
        { id: "date", sortKey: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm font-bold">{dayText(r.date)}</span> },
        ...(!exempt ? [
          { id: "sales", sortKey: "totalSales", header: t("oldReports.total_sales_excl_tax"), cell: (r: DailySalesRow) => <span className="text-sm font-medium">{money(r.totalSales)}</span> },
          { id: "tax", sortKey: "totalTax", header: t("oldReports.total_tax"), cell: (r: DailySalesRow) => <span className="text-sm">{money(r.totalTax)}</span> },
        ] : []),
        { id: "net", sortKey: "netSales", header: t("oldReports.grand_total_with_tax"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.netSales)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.date) },
        ...(!exempt ? [{ header: t("oldReports.total_sales_excl_tax"), value: (r: DailySalesRow) => money(r.totalSales) }, { header: t("oldReports.total_tax"), value: (r: DailySalesRow) => money(r.totalTax) }] : []),
        { header: t("oldReports.grand_total_with_tax"), value: (r) => money(r.netSales) },
      ]} />
  )
}
