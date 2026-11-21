import { useState } from "react"
import { Barcode, DollarSign, ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { productPurchases, type ProductPurchaseRow } from "../api"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

/** The purchases of one item between two dates, laid out as in the current system. */
export default function ItemPurchasesReport() {
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
    <PagedReport<ProductPurchaseRow, Awaited<ReturnType<typeof productPurchases>>>
      id="item-purchases" title={t("oldReports.item_purchases_report")} icon={Barcode} extra={productFilter} dep={applied?.id} enabled={!!applied}
      onSearch={() => setApplied(product)} onClear={() => { setProduct(null); setApplied(null) }}
      filterText={(a) => `${applied?.productNameAr ?? ""} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size) => productPurchases({ branchid: currentBranchId(), productID: applied!.id, from: a.from, to: a.to, Page: page, PageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r, i) => `${r.productId}-${r.supplierName}-${i}`}
      cards={(r) => [
        { title: t("oldReports.total_purchases_amount"), value: money(r?.summary.totalPurchasesCost), suffix: sar, icon: DollarSign, color: "orange" },
        { title: t("oldReports.purchased_quantity"), value: (r?.summary.totalQuantity ?? 0).toLocaleString(), icon: ShoppingCart, color: "blue" },
      ]}
      columns={[
        { id: "supplier", header: t("oldReports.supplier_name"), cell: (r) => <span className="text-sm font-bold">{r.supplierName}</span> },
        { id: "qty", header: t("oldReports.purchased_quantity"), cell: (r) => <span className="text-sm font-medium">{r.quantity}</span> },
        { id: "price", header: t("oldReports.unit_price"), cell: (r) => <span className="text-sm">{money(r.unitPrice)}</span> },
        { id: "total", header: t("oldReports.total_amount"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.totalCost)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.supplier_name"), value: (r) => r.supplierName },
        { header: t("oldReports.purchased_quantity"), value: (r) => r.quantity },
        { header: t("oldReports.unit_price"), value: (r) => money(r.unitPrice) },
        { header: t("oldReports.total_amount"), value: (r) => money(r.totalCost) },
      ]} />
  )
}
