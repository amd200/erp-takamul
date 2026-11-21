import { BarChart3, DollarSign, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { inventoryStock, type StockRow } from "../api"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

/** Stock on hand with its cost and selling value, laid out as in the current system. */
export default function StockBalanceReport() {
  const { t } = useTranslation()
  const sar = t("oldReports.sar")
  return (
    <PagedReport<StockRow, Awaited<ReturnType<typeof inventoryStock>>>
      id="stock-balance" title={t("oldReports.inventory_report")} icon={BarChart3}
      filterText={(a) => `${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => inventoryStock({ branchid: currentBranchId(), from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.productId}
      cards={(r) => [
        { title: t("oldReports.total_cost"), value: money(r?.totalCost), suffix: sar, icon: Wallet, color: "orange" },
        { title: t("oldReports.total_selling_price"), value: money(r?.totalSale), suffix: sar, icon: DollarSign, color: "blue" },
      ]}
      columns={[
        { id: "name", header: t("oldReports.item_name"), cell: (r) => <span className="text-sm font-bold">{r.productName}</span> },
        { id: "category", header: t("oldReports.category"), cell: (r) => <span className="text-sm">{r.categoryName}</span> },
        { id: "cost", header: t("oldReports.cost"), cell: (r) => <span className="text-sm whitespace-nowrap">{money(r.costPrice)}</span> },
        { id: "price", header: t("oldReports.price"), cell: (r) => <span className="text-sm whitespace-nowrap">{money(r.salePrice)}</span> },
        { id: "qty", header: t("oldReports.quantity"), cell: (r) => <span className="text-sm font-medium whitespace-nowrap">{money(r.currentBalance)}</span> },
        { id: "totalCost", header: t("oldReports.total_cost"), cell: (r) => <span className="text-sm font-bold whitespace-nowrap text-primary">{money(r.totalCost)}</span> },
        { id: "totalSale", header: t("oldReports.total_selling_price"), cell: (r) => <span className="text-sm font-bold whitespace-nowrap text-primary">{money(r.totalSale)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.item_name"), value: (r) => r.productName },
        { header: t("oldReports.category"), value: (r) => r.categoryName },
        { header: t("oldReports.cost"), value: (r) => money(r.costPrice) },
        { header: t("oldReports.price"), value: (r) => money(r.salePrice) },
        { header: t("oldReports.quantity"), value: (r) => money(r.currentBalance) },
        { header: t("oldReports.total_cost"), value: (r) => money(r.totalCost) },
        { header: t("oldReports.total_selling_price"), value: (r) => money(r.totalSale) },
      ]} />
  )
}
