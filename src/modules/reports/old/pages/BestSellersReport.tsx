import { TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/modules/partners/mappers"
import { topSelling, type TopSellingRow } from "../api"
import { money } from "../output"
import { PagedReport, slice } from "../PagedReport"

/** The best-selling items between two dates, laid out as in the current system. The server sends them in one list; they are paged here. */
export default function BestSellersReport() {
  const { t } = useTranslation()
  return (
    <PagedReport<TopSellingRow, { rows: TopSellingRow[]; total: number }>
      id="best-sellers" title={t("oldReports.top_selling_product_report")} icon={TrendingUp}
      filterText={(a) => `${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={async (a, page, size) => {
        const all = await topSelling({ branchid: currentBranchId(), from: a.from, to: a.to })
        return { rows: slice(all, page, size), total: all.length }
      }}
      rowsOf={(r) => r.rows} totalOf={(r) => r.total} rowKey={(r) => r.productId}
      cards={() => []}
      columns={[
        { id: "code", header: t("oldReports.barcode"), cell: (r) => <span className="font-mono text-xs">{r.barcode}</span> },
        { id: "name", header: t("oldReports.product_name"), cell: (r) => <span className="font-bold">{r.productName}</span> },
        { id: "price", header: t("oldReports.selling_price"), cell: (r) => (r.sellingPrice == null ? "-" : money(r.sellingPrice)) },
        { id: "qty", header: t("oldReports.sales_count"), cell: (r) => r.totalQuantitySold },
        { id: "total", header: t("oldReports.total_sales"), cell: (r) => <span className="font-bold text-primary">{money(r.totalSales)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.barcode"), value: (r) => r.barcode ?? "" },
        { header: t("oldReports.product_name"), value: (r) => r.productName },
        { header: t("oldReports.selling_price"), value: (r) => (r.sellingPrice == null ? "-" : money(r.sellingPrice)) },
        { header: t("oldReports.sales_count"), value: (r) => r.totalQuantitySold },
        { header: t("oldReports.total_sales"), value: (r) => money(r.totalSales) },
      ]} />
  )
}
