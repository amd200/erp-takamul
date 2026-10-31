import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { Edit2, RotateCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
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
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${paid ? "bg-[#00e6821a] text-[#09ad95]" : partial ? "bg-[#fef3c7] text-[#f59e0b]" : "bg-[#f50b0b1a] text-[#b40b09]"}`}>
      {paid ? t("purchases.statusPaid") : partial ? t("purchases.statusPartial") : t("purchases.statusUnpaid")}
    </span>
  )
}

/** Purchase invoices from suppliers, a page at a time; the server searches. Laid out as in the current system. */
export default function PurchasesPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const { data, isLoading, isFetching, isError, refetch } = usePurchasePage({ page: page + 1, pageSize: PAGE_SIZE, searchTerm: search })
  const cancel = useCancelPurchase()
  const [toCancel, setToCancel] = useState<Purchase | null>(null)
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])

  const columns: Column<Purchase>[] = [
    { id: "number", header: t("purchases.colNumber"), cell: (p) => <Link to={`/purchases/${p.id}`} className="hover:underline">{p.purchaseOrderNumber}</Link> },
    { id: "date", header: t("purchases.colDate"), cell: (p) => (p.orderDate ? formatDateTime(p.orderDate, i18n.language) : "—") },
    { id: "supplier", header: t("purchases.colSupplier"), cell: (p) => p.supplierName || "—" },
    { id: "status", header: t("purchases.colStatus"), cell: (p) => <Status p={p} /> },
    { id: "total", header: t("purchases.colTotal"), cell: (p) => formatMoney(p.grandTotal ?? 0) },
    { id: "paid", header: t("purchases.colPaid"), cell: (p) => formatMoney(p.paidAmount ?? 0) },
    { id: "actions", header: t("purchases.colActions"), cell: (p) => (
      <div className="flex items-center justify-center gap-2">
        {can(P.purchases.edit) && <Link to={`/purchases/${p.id}/edit`} className="btn-minimal-action btn-edit" aria-label={t("common.edit")}><Edit2 size={16} /></Link>}
        {can(P.purchases.cancel) && <button type="button" className="btn-minimal-action btn-delete" aria-label={t("purchases.deleteInvoice")} onClick={() => setToCancel(p)}><Trash2 size={16} /></button>}
      </div>
    ) },
  ]

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
        <div className="mb-6">
          <h1 className="text-2xl leading-snug font-bold">{t("purchases.listTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("purchases.listSubtitle")}</p>
        </div>
        <DataTable rows={data?.items} loading={isLoading} columns={columns} rowKey={(p) => p.id} searchPlaceholder={t("purchases.searchOld")}
          server={{ total: data?.total ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading }}
          empty={isError ? <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} /> : null} />
      </div>
      <ConfirmDialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)} pending={cancel.isPending}
        title={`${t("purchases.deleteInvoice")} ${toCancel?.purchaseOrderNumber ?? ""}`} description={t("purchases.deleteConfirm")} confirmLabel={t("purchases.confirmDelete")}
        onConfirm={() => toCancel && cancel.mutate(toCancel.id, { onSettled: () => setToCancel(null) })} />
    </>
  )
}
