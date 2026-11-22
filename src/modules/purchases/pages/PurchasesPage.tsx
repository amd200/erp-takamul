import { PageBox } from "@/components/PageBox"
import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { HandCoins, RotateCw, ShoppingCart } from "lucide-react"
import { PurchasePaymentsDialog } from "../components/PurchasePaymentsDialog"
import { useTranslation } from "react-i18next"
import { RowActions } from "@/components/RowActions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDateTime, formatMoney } from "@/lib/format"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useCancelPurchase, usePurchasePage } from "../queries"
import type { Purchase } from "../types"

const PAGE_SIZE = 20

/** A purchase invoice's payment state as the current system words and colours it: paid, partly paid, or on credit. */
function Status({ p }: { p: Purchase }) {
  const { t } = useTranslation()
  const paid = Math.round((p.paidAmount ?? 0) * 100) >= Math.round((p.grandTotal ?? 0) * 100)
  const partial = (p.paidAmount ?? 0) > 0 && !paid
  return (
    <StatusBadge tone={paid ? "success" : partial ? "warning" : "danger"}>
      {paid ? t("purchases.statusPaid") : partial ? t("purchases.statusPartial") : t("purchases.statusUnpaid")}
    </StatusBadge>
  )
}

/** Purchase invoices from suppliers, a page at a time; the server searches. Laid out as in the current system. */
export default function PurchasesPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const { sort, sortBy, sortDescending } = useTableSort(() => setPage(0))
  const { data, isLoading, isFetching, isError, refetch } = usePurchasePage({ page: page + 1, pageSize: PAGE_SIZE, searchTerm: search, sortBy, sortDescending })
  const cancel = useCancelPurchase()
  const [toCancel, setToCancel] = useState<Purchase | null>(null)
  const [paymentsId, setPaymentsId] = useState<number | null>(null)
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])

  const columns: Column<Purchase>[] = [
    { id: "purchaseOrderNumber", sortable: true, header: t("purchases.colNumber"), cell: (p) => <Link to={`/purchases/${p.id}`} className="hover:underline">{p.purchaseOrderNumber}</Link> },
    { id: "orderDate", sortable: true, className: "min-w-44", header: t("purchases.colDate"), cell: (p) => (p.orderDate ? formatDateTime(p.orderDate, i18n.language) : "—") },
    { id: "supplierName", sortable: true, header: t("purchases.colSupplier"), cell: (p) => p.supplierName || "—" },
    { id: "paymentStatus", sortable: true, header: t("purchases.colStatus"), cell: (p) => <Status p={p} /> },
    { id: "grandTotal", sortable: true, header: t("purchases.colTotal"), cell: (p) => formatMoney(p.grandTotal ?? 0) },
    { id: "paidAmount", sortable: true, header: t("purchases.colPaid"), cell: (p) => formatMoney(p.paidAmount ?? 0) },
    { id: "actions", header: t("purchases.colActions"), cell: (p) => (
      <RowActions extra={[can(P.purchases.edit) && { key: "payments", label: t("purchases.payments"), icon: <HandCoins />, onSelect: () => setPaymentsId(p.id) }]} editTo={can(P.purchases.edit) ? `/purchases/${p.id}/edit` : undefined} onDelete={can(P.purchases.cancel) ? () => setToCancel(p) : undefined} />
    ) },
  ]

  return (
    <>
      <PageBox title={t("purchases.listTitle")} subtitle={t("purchases.listSubtitle")}>
        <DataTable rows={data?.items} loading={isLoading} columns={columns} rowKey={(p) => p.id} sort={sort} searchPlaceholder={t("purchases.searchOld")}
          server={{ total: data?.totalCount ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading }}
          empty={isError ? <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} /> : <EmptyState icon={<ShoppingCart />} title={t("purchases.empty")} hint={t("purchases.emptyHint")} />} />
      </PageBox>
      <PurchasePaymentsDialog purchaseId={paymentsId} onOpenChange={(o) => !o && setPaymentsId(null)} />
      <ConfirmDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)} pending={cancel.isPending}
        title={`${t("purchases.deleteInvoice")} ${toCancel?.purchaseOrderNumber ?? ""}`} description={t("purchases.deleteConfirm")} confirmLabel={t("purchases.confirmDelete")}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id, { onSettled: () => setToCancel(null) })} />
    </>
  )
}
