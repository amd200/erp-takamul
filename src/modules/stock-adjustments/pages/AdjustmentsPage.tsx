import { PageBox } from "@/components/PageBox"
import { Link } from "react-router-dom"
import { SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RowActions } from "@/components/RowActions"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { formatDateTime } from "@/lib/format"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAdjustments } from "../queries"
import type { AdjustmentDto } from "../types"

/** Quantity adjustments, laid out as in the current system: a titled box with an add button, and a plain table. */
export default function AdjustmentsPage() {
  const { t, i18n } = useTranslation()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useAdjustments({ SortBy: sortBy, SortDescending: sortDescending })

  const columns: Column<AdjustmentDto>[] = [
    { id: "id", sortKey: "id", header: "ID", cell: (a) => a.id },
    { id: "date", sortKey: "operationDate", header: t("adjForm.date"), cell: (a) => formatDateTime(a.operationDate ?? "", i18n.language) },
    { id: "by", sortKey: "performedBy", header: t("adjForm.enteredBy"), cell: (a) => a.performedBy },
    { id: "notes", sortKey: "notes", header: t("adjForm.note"), cell: (a) => a.notes },
    { id: "actions", header: t("adjForm.actions"), cell: (a) => (
      <RowActions viewTo={`/products/quantity-adjustments/view/${a.id}`} />
    ) },
  ]

  return (
    <PageBox title={t("adjForm.title")} subtitle={t("adjForm.subtitle")}
      action={<Can perm={P.stock.adjust}><Button asChild><Link to="/products/quantity-adjustments/create">{t("adjForm.add")}</Link></Button></Can>}>
      <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(a) => a.id}
        searchText={(a) => `${a.id} ${a.performedBy} ${a.notes}`} searchPlaceholder={t("adjForm.search")}
        empty={<EmptyState icon={<SlidersHorizontal />} title={t("adjForm.empty")} />} />
    </PageBox>
  )
}
