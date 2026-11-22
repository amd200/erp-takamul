import { Barcode, DollarSign } from "lucide-react"
import { useTranslation } from "react-i18next"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { productsSales, type ProductsSalesRow } from "../api"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

/** The sales of every item between two dates, laid out as in the current system. */
export default function ProductsSalesReport() {
  const { t } = useTranslation()
  return (
    <PagedReport<ProductsSalesRow, Awaited<ReturnType<typeof productsSales>>>
      id="products-sales" title={t("oldReports.products_sales_report")} icon={Barcode} defaultSort={{ key: "totalSales", desc: true }}
      filterText={(a) => `${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size, s) => productsSales({ branchid: currentBranchId(), from: a.from, to: a.to, Page: page, PageSize: size, SortBy: s.key, SortDescending: s.desc })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.productId}
      cards={(r) => [{ title: t("oldReports.total_sales"), value: money(r?.totals.totalSales), suffix: t("oldReports.sar"), icon: DollarSign, color: "orange" }]}
      columns={[
        { id: "code", header: t("oldReports.barcode"), cell: (r) => <span className="font-mono text-xs">{r.productCode}</span> },
        { id: "productName", sortable: true, header: t("oldReports.product_name"), cell: (r) => <span className="font-bold">{r.productName}</span> },
        { id: "category", header: t("oldReports.category"), cell: (r) => r.categoryName },
        { id: "quantitySold", sortable: true, header: t("oldReports.sold_quantity"), cell: (r) => r.quantitySold },
        { id: "totalSales", sortable: true, header: t("oldReports.total_sales"), cell: (r) => <span className="font-bold text-primary">{money(r.totalSales)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.barcode"), value: (r) => r.productCode },
        { header: t("oldReports.product_name"), value: (r) => r.productName },
        { header: t("oldReports.category"), value: (r) => r.categoryName },
        { header: t("oldReports.sold_quantity"), value: (r) => r.quantitySold },
        { header: t("oldReports.total_sales"), value: (r) => money(r.totalSales) },
      ]} />
  )
}
