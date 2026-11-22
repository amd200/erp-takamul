import { useState } from "react"
import { FileText, PackageMinus, PackagePlus, Scale } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { productMovement, type MovementRow } from "../api"
import { dayText, money } from "../output"
import { PagedReport } from "../PagedReport"

/** The stock movements of one item between two dates, laid out as in the current system. */
export default function ItemMovementReport() {
  const { t } = useTranslation()
  const [product, setProduct] = useState<Product | null>(null)
  const [applied, setApplied] = useState<Product | null>(null)
  const productFilter = (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{t("oldReports.product")}</Label>
      <ProductSearchPicker accept={(p) => p.productType !== "Branched"} onPick={setProduct}>
        <Button type="button" variant="outline" className="h-10 w-full justify-start font-normal"><span className="truncate">{product?.productNameAr ?? t("oldReports.select_product")}</span></Button>
      </ProductSearchPicker>
    </div>
  )
  const operation = (r: MovementRow) => (r.qtyIn > 0 ? r.qtyIn : -r.qtyOut)
  return (
    <PagedReport<MovementRow, Awaited<ReturnType<typeof productMovement>>>
      id="item-movement" title={t("oldReports.item_movement_report")} icon={FileText} extra={productFilter} dep={applied?.id} enabled={!!applied} defaultSort={{ key: "transDate", desc: false }}
      onSearch={() => setApplied(product)} onClear={() => { setProduct(null); setApplied(null) }}
      filterText={(a) => `${applied?.productNameAr ?? ""} | ${t("oldReports.from")}: ${a.from} | ${t("oldReports.to")}: ${a.to}`}
      read={(a, page, size, s) => productMovement({ branchid: currentBranchId(), productId: applied!.id, from: a.from, to: a.to, Page: page, PageSize: size, SortBy: s.key, SortDescending: s.desc })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r, i) => `${r.invoiceNo}-${i}`}
      cards={(r) => [
        { title: t("oldReports.total_qty_in"), value: money(r?.totals.totalQtyIn), icon: PackagePlus, color: "blue" },
        { title: t("oldReports.total_qty_out"), value: money(r?.totals.totalQtyOut), icon: PackageMinus, color: "red" },
        { title: t("oldReports.net_quantity"), value: money(r?.totals.netQty), icon: Scale, color: "purple" },
      ]}
      columns={[
        { id: "transDate", sortable: true, header: t("oldReports.trans_date"), cell: (r) => <span className="text-sm whitespace-nowrap">{dayText(r.transDate)}</span> },
        { id: "type", header: t("oldReports.movement_type"), cell: (r) => r.transType },
        { id: "ref", header: t("oldReports.reference"), cell: (r) => <span className="font-bold">{r.invoiceNo}</span> },
        { id: "before", header: t("oldReports.quantity_before_movement"), cell: (r) => money(r.quantityBefore) },
        { id: "op", header: t("oldReports.operation_quantity"), cell: (r) => <span className={operation(r) >= 0 ? "text-green-600" : "text-red-500"}>{money(operation(r))}</span> },
        { id: "after", header: t("oldReports.quantity_after"), cell: (r) => <span className="font-bold">{money(r.runningBalance)}</span> },
      ]}
      outColumns={[
        { header: t("oldReports.trans_date"), value: (r) => dayText(r.transDate) },
        { header: t("oldReports.movement_type"), value: (r) => r.transType },
        { header: t("oldReports.reference"), value: (r) => r.invoiceNo },
        { header: t("oldReports.quantity_before_movement"), value: (r) => money(r.quantityBefore) },
        { header: t("oldReports.operation_quantity"), value: (r) => money(operation(r)) },
        { header: t("oldReports.quantity_after"), value: (r) => money(r.runningBalance) },
      ]} />
  )
}
