import { PageBox } from "@/components/PageBox"
import { useState } from "react"
import { Link } from "react-router-dom"
import { SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { RowActions } from "@/components/RowActions"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { formatDateTime } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAdjustmentOutput, useAdjustments, useDeleteAdjustment } from "../queries"
import type { AdjustmentDto } from "../types"

/** Quantity adjustments, laid out as in the current system: a titled box with an add button, and a plain table. */
export default function AdjustmentsPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const del = useDeleteAdjustment()
  const output = useAdjustmentOutput()
  const [toDelete, setToDelete] = useState<AdjustmentDto | null>(null)
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useAdjustments({ SortBy: sortBy, SortDescending: sortDescending })

  const columns: Column<AdjustmentDto>[] = [
    { id: "operationDate", sortable: true, width: "190px", header: t("adjForm.date"), cell: (a) => formatDateTime(a.operationDate ?? "", i18n.language) },
    { id: "performedBy", sortable: true, width: "170px", header: t("adjForm.enteredBy"), cell: (a) => a.performedBy },
    { id: "notes", sortable: true, header: t("adjForm.note"), cell: (a) => a.notes },
    { id: "actions", width: "72px", header: t("adjForm.actions"), cell: (a) => (
      <RowActions viewTo={`/products/quantity-adjustments/view/${a.id}`} editTo={can(P.stock.adjust) ? `/products/quantity-adjustments/edit/${a.id}` : undefined}
        onPrint={() => output.mutate({ adjustment: a, as: "print" })} onPdf={() => output.mutate({ adjustment: a, as: "pdf" })} onDelete={can(P.stock.delete) ? () => setToDelete(a) : undefined} />
    ) },
  ]

  return (
    <PageBox title={t("adjForm.title")} subtitle={t("adjForm.subtitle")}
      action={<Can perm={P.stock.adjust}><Button asChild><Link to="/products/quantity-adjustments/create">{t("adjForm.add")}</Link></Button></Can>}>
      <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(a) => a.id}
        searchText={(a) => `${a.id} ${a.performedBy} ${a.notes}`} searchPlaceholder={t("adjForm.search")}
        empty={<EmptyState icon={<SlidersHorizontal />} title={t("adjForm.empty")} />} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("adjForm.deleteTitle")} description={t("adjForm.deleteBody")}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </PageBox>
  )
}
