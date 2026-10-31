import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Barcode, DollarSign, ShoppingCart } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Column } from "@/components/DataTable"
import { currentBranchId } from "@/modules/partners/mappers"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import type { Product } from "@/modules/products/types"
import { itemSales, type ItemSalesRow } from "../api"
import { dayText, excelReport, money, pdfReport, printReport, type ReportOutput } from "../output"
import { FiscalFilters, ReportShell, SummaryCards, type SummaryCard } from "../ReportShell"
import { ReportTable } from "../ReportTable"
import { useFiscalFilters } from "../useFiscalFilters"

const PAGE = 10

/** The sales of one item between two dates, laid out as in the current system. */
export default function ItemSalesReport() {
  const { t } = useTranslation()
  const f = useFiscalFilters()
  const [product, setProduct] = useState<Product | null>(null)
  const [applied, setApplied] = useState<Product | null>(null)
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ key: "date", desc: true })
  const [page, setPage] = useState(0)
  const [pdfBusy, setPdfBusy] = useState(false)
  const { data, isFetching } = useQuery({
    queryKey: ["old-reports", "item-sales", f.applied, applied?.productCode, sort],
    queryFn: () => itemSales({ branchid: currentBranchId(), productCode: applied!.productCode!, from: f.applied.from, to: f.applied.to, SortBy: sort.key, SortDescending: sort.desc }),
    enabled: f.searched && !!applied?.productCode,
  })
  const rows = f.searched ? data?.details ?? [] : []
  const sar = t("oldReports.sar")

  const cards: SummaryCard[] = f.searched ? [
    { title: t("oldReports.total_item_sales"), value: money(data?.summary.totalSales), suffix: sar, icon: DollarSign, color: "orange" },
    { title: t("oldReports.total_quantity_sold"), value: (data?.summary.totalQuantitySold ?? 0).toLocaleString(), icon: ShoppingCart, color: "blue" },
  ] : []

  const title = t("oldReports.item_sales_report")
  const out: ReportOutput<ItemSalesRow> = {
    title, cards, rows,
    filters: `${applied?.productNameAr ?? ""} | ${t("oldReports.from")}: ${f.applied.from} | ${t("oldReports.to")}: ${f.applied.to}`,
    columns: [
      { header: t("oldReports.serial"), value: (_, i) => i + 1 },
      { header: t("oldReports.date"), value: (r) => dayText(r.date) },
      { header: t("oldReports.invoice_number"), value: (r) => r.orderNumber },
      { header: t("oldReports.sold_quantity"), value: (r) => r.quantitySold },
      { header: t("oldReports.total_sales_value"), value: (r) => money(r.totalSales) },
    ],
  }
  const run = (fn: (o: typeof out) => unknown) => () => rows.length > 0 && fn(out)

  const first = page * PAGE
  const columns: Column<ItemSalesRow>[] = [
    { id: "serial", header: t("oldReports.serial"), cell: (r) => <span className="text-sm font-semibold">{rows.indexOf(r) + 1}</span> },
    { id: "date", sortKey: "date", header: t("oldReports.date"), cell: (r) => <span className="text-sm">{dayText(r.date)}</span> },
    { id: "number", header: t("oldReports.invoice_number"), cell: (r) => <span className="text-sm font-bold">{r.orderNumber}</span> },
    { id: "qty", header: t("oldReports.sold_quantity"), cell: (r) => <span className="text-sm font-medium">{r.quantitySold}</span> },
    { id: "total", header: t("oldReports.total_sales_value"), cell: (r) => <span className="text-sm font-bold text-primary">{money(r.totalSales)}</span> },
  ]

  const productFilter = (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{t("oldReports.product_name")}</Label>
      <ProductSearchPicker accept={(p) => p.productType !== "Branched"} onPick={setProduct}>
        <Button type="button" variant="outline" className="h-10 w-full justify-start font-normal"><span className="truncate">{product?.productNameAr ?? t("oldReports.select_product")}</span></Button>
      </ProductSearchPicker>
    </div>
  )

  return (
    <ReportShell title={title} icon={Barcode} onPrint={run(printReport)} onExcel={run(excelReport)} pdfBusy={pdfBusy}
      onPdf={() => { if (rows.length) { setPdfBusy(true); Promise.resolve(pdfReport(out)).finally(() => setPdfBusy(false)) } }}>
      <SummaryCards cards={cards} />
      <FiscalFilters withFiscal={false} extra={productFilter} loading={isFetching}
        f={{ ...f, search: () => { setApplied(product); f.search(); setPage(0) }, clear: () => { setProduct(null); setApplied(null); f.clear(); setPage(0) } }} />
      <ReportTable rows={rows.slice(first, first + PAGE)} columns={columns} loading={isFetching} searched={f.searched} rowKey={(r) => r.orderNumber}
        server={{ total: rows.length, page, pageSize: PAGE, onPage: setPage, sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }} />
    </ReportShell>
  )
}
