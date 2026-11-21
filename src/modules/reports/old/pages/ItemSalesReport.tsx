import { useState } from "react"
import { Barcode, DollarSign, ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { itemSales, type ItemSalesRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"

/** The sales of one item between two dates, laid out as in the current system. */
export default function ItemSalesReport() {
  const { t } = useTranslation()
  const [product, setProduct] = useState<Product | null>(null)
  const [applied, setApplied] = useState<Product | null>(null)
  const sar = t("oldReports.sar")
  const productFilter = (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{t("oldReports.product_name")}</Label>
      <ProductSearchPicker accept={(p) => p.productType !== "Branched"} onPick={setProduct}>
        <Button type="button" variant="outline" className="h-10 w-full justify-start font-normal"><span className="truncate">{product?.productNameAr ?? t("oldReports.select_product")}</span></Button>
      </ProductSearchPicker>
    </div>
  )
  return (
    <PagedReport<ItemSalesRow, Awaited<ReturnType<typeof itemSales>>>
      id="item-sales" title={t("oldReports.item_sales_report")} icon={Barcode} extra={productFilter} dep={applied?.id} enabled={!!applied?.productCode}
      onSearch={() => setApplied(product)} onClear={() => { setProduct(null); setApplied(null) }}
      filterText={(a) => `${applied?.productNameAr ?? ""} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => itemSales({ branchid: currentBranchId(), productCode: applied!.productCode!, from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.invoiceNumber}
      cards={(r) => [
        { title: t("oldReports.total_item_sales"), value: money(r?.summary.netTotal), suffix: sar, icon: DollarSign, color: "orange" },
        { title: t("oldReports.total_quantity_sold"), value: (r?.summary.totalQuantity ?? 0).toLocaleString(), icon: ShoppingCart, color: "blue" },
      ]}
      columns={[
        { id: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.invoiceDate)}</span> },
        { id: "number", header: t("oldReports.invoice_number"), cell: (r) => <span className="text-sm font-bold">{r.invoiceNumber}</span> },
        { id: "qty", header: t("oldReports.sold_quantity"), cell: (r) => <span className="text-sm font-medium">{r.quantity}</span> },
        { id: "total", header: t("oldReports.total_sales_value"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.netTotal)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.date"), value: (r) => dayText(r.invoiceDate) },
        { header: t("oldReports.invoice_number"), value: (r) => r.invoiceNumber },
        { header: t("oldReports.sold_quantity"), value: (r) => r.quantity },
        { header: t("oldReports.total_sales_value"), value: (r) => money(r.netTotal) },
      ]} />
  )
}
