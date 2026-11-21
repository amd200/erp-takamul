import { Calendar, DollarSign, Percent, Receipt, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { useAppSettings } from "@/modules/settings"
import { dailyPurchases, type DailyPurchaseRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"

/** Purchases totals by day, laid out as in the current system. The server sends no tax figure, so none is shown. */
export default function PurchasesByDayReport() {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const sar = t("oldReports.sar")
  return (
    <PagedReport<DailyPurchaseRow, Awaited<ReturnType<typeof dailyPurchases>>>
      id="purchases-by-day" title={t("oldReports.purchases_by_day")} icon={Calendar} withFiscal
      filterText={(a) => `${t("oldReports.fiscal_year")}: ${a.fiscalYear} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => dailyPurchases({ branchid: currentBranchId(), from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.date}
      cards={(r) => [
        { title: t("oldReports.total_invoices"), value: (r?.totals.totalInvoices ?? 0).toLocaleString("en-US"), icon: Receipt, color: "blue" },
        ...(!exempt ? [
          { title: t("oldReports.total_purchases_excl_tax"), value: money(r?.totals.totalPurchases), suffix: sar, icon: TrendingUp, color: "orange" as const },
        ] : []),
        { title: t("oldReports.total_discount"), value: money(r?.totals.totalDiscount), suffix: sar, icon: Percent, color: "purple" },
        { title: t("oldReports.grand_total_with_tax"), value: money(r?.totals.netPurchases), suffix: sar, icon: DollarSign, color: "teal" },
      ]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm font-bold">{dayText(r.date)}</span> },
        ...(!exempt ? [
          { id: "purchases", header: t("oldReports.total_purchases_excl_tax"), cell: (r: DailyPurchaseRow) => <span className="text-sm font-medium">{money(r.totalPurchases)}</span> },
        ] : []),
        { id: "net", header: t("oldReports.grand_total_with_tax"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.netPurchases)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.date) },
        ...(!exempt ? [{ header: t("oldReports.total_purchases_excl_tax"), value: (r: DailyPurchaseRow) => money(r.totalPurchases) }] : []),
        { header: t("oldReports.grand_total_with_tax"), value: (r) => money(r.netPurchases) },
      ]} />
  )
}
