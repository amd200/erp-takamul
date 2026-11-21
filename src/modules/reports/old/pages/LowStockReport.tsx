import { AlertTriangle, Boxes, Package, PackageMinus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { stockAlerts, type StockAlertRow } from "../api"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

/** Items at or under their reorder point, laid out as in the current system. */
export default function LowStockReport() {
  const { t } = useTranslation()
  return (
    <PagedReport<StockAlertRow, Awaited<ReturnType<typeof stockAlerts>>>
      id="low-stock" title={t("oldReports.low_stock_alerts")} icon={AlertTriangle} dates={false}
      filterText={() => t("oldReports.low_stock_alerts")}
      read={(_, page, size, s) => stockAlerts({ branchid: currentBranchId(), Page: page, PageSize: size, SortBy: s.key, SortDescending: s.desc })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.productId}
      cards={(r) => [
        { title: t("oldReports.total_items"), value: (r?.totals.productsCount ?? 0).toLocaleString("en-US"), icon: Package, color: "blue" },
        { title: t("oldReports.total_current_quantity"), value: money(r?.totals.currentQty), icon: Boxes, color: "purple" },
        { title: t("oldReports.total_reorder_point"), value: money(r?.totals.minStockLevel), icon: AlertTriangle, color: "orange" },
        { title: t("oldReports.total_shortage_quantity"), value: money(r?.totals.shortageQty), icon: PackageMinus, color: "red" },
      ]}
      columns={[
        { id: "code", header: t("oldReports.barcode"), cell: (r) => <span className="text-sm font-medium">{r.productCode}</span> },
        { id: "name", sortKey: "productName", header: t("oldReports.item_name"), cell: (r) => <span className="text-sm font-bold">{r.productName}</span> },
        { id: "qty", sortKey: "currentQty", header: t("oldReports.current_quantity"), cell: (r) => <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-sm font-bold text-red-700">{money(r.currentQty)}</span> },
        { id: "min", sortKey: "minStockLevel", header: t("oldReports.reorder_point"), cell: (r) => <span className="text-sm font-semibold whitespace-nowrap">{money(r.minStockLevel)}</span> },
        { id: "short", header: t("oldReports.shortage_quantity"), cell: (r) => <span className="text-sm font-semibold">{money(r.shortageQty)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.barcode"), value: (r) => r.productCode },
        { header: t("oldReports.item_name"), value: (r) => r.productName },
        { header: t("oldReports.current_quantity"), value: (r) => money(r.currentQty) },
        { header: t("oldReports.reorder_point"), value: (r) => money(r.minStockLevel) },
        { header: t("oldReports.shortage_quantity"), value: (r) => money(r.shortageQty) },
      ]} />
  )
}
