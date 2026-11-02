import { Barcode, DollarSign } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/modules/partners/mappers"
import { productsPurchases, type ProductsPurchasesRow } from "../api"
import { money } from "../output"
import { PagedReport, slice } from "../PagedReport"

/** The purchases of every item between two dates (total quantity and cost per item). The server sends one sorted list; it is paged here. */
export default function ProductsPurchasesReport() {
  const { t } = useTranslation()
  return (
    <PagedReport<ProductsPurchasesRow, { rows: ProductsPurchasesRow[]; total: number; grand: number }>
      id="products-purchases" title={t("oldReports.products_purchases_report")} icon={Barcode} defaultSort={{ key: "totalpurchases", desc: true }}
      filterText={(a) => `${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={async (a, page, size, s) => {
        const r = await productsPurchases({ branchid: currentBranchId(), from: a.from, to: a.to, SortBy: s.key, SortDescending: s.desc })
        return { rows: slice(r.details, page, size), total: r.details.length, grand: r.summary.grandTotalPurchases }
      }}
      rowsOf={(r) => r.rows} totalOf={(r) => r.total} rowKey={(r) => `${r.barcode}-${r.productName}`}
      cards={(r) => [{ title: t("oldReports.total_purchases_amount"), value: money(r?.grand), suffix: t("oldReports.sar"), icon: DollarSign, color: "orange" }]}
      columns={[
        { id: "code", sortKey: "barcode", header: t("oldReports.barcode"), cell: (r) => <span className="font-mono text-xs">{r.barcode}</span> },
        { id: "name", sortKey: "productname", header: t("oldReports.product_name"), cell: (r) => <span className="font-bold">{r.productName}</span> },
        { id: "qty", sortKey: "purchasescount", header: t("oldReports.purchased_quantity"), cell: (r) => r.purchasesCount },
        { id: "total", sortKey: "totalpurchases", header: t("oldReports.total_purchases_amount"), cell: (r) => <span className="font-bold text-primary">{money(r.totalPurchases)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.barcode"), value: (r) => r.barcode ?? "" },
        { header: t("oldReports.product_name"), value: (r) => r.productName },
        { header: t("oldReports.purchased_quantity"), value: (r) => r.purchasesCount },
        { header: t("oldReports.total_purchases_amount"), value: (r) => money(r.totalPurchases) },
      ]} />
  )
}
