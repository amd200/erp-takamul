import { Link } from "react-router-dom"
import { Eye, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { formatDateTime } from "@/lib/format"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAdjustments } from "../queries"
import type { AdjustmentDto } from "../types"

/** Quantity adjustments, laid out as in the current system: a titled box with an add button, and a plain table. */
export default function AdjustmentsPage() {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useAdjustments()

  const columns: Column<AdjustmentDto>[] = [
    { id: "id", header: "ID", cell: (a) => a.id },
    { id: "date", header: t("adjForm.date"), cell: (a) => formatDateTime(a.operationDate ?? "", i18n.language) },
    { id: "by", header: t("adjForm.enteredBy"), cell: (a) => a.performedBy },
    { id: "notes", header: t("adjForm.note"), cell: (a) => a.notes },
    { id: "actions", header: t("adjForm.actions"), cell: (a) => (
      <div className="flex items-center justify-center gap-2">
        <Link to={`/products/quantity-adjustments/view/${a.id}`} className="btn-minimal-action btn-view" aria-label={t("common.view")}><Eye size={16} /></Link>
      </div>
    ) },
  ]

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-snug font-bold">{t("adjForm.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("adjForm.subtitle")}</p>
        </div>
        <Can perm={P.stock.adjust}><Button asChild><Link to="/products/quantity-adjustments/create">{t("adjForm.add")}</Link></Button></Can>
      </div>
      <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(a) => a.id}
        searchText={(a) => `${a.id} ${a.performedBy} ${a.notes}`} searchPlaceholder={t("adjForm.search")}
        empty={<EmptyState icon={<SlidersHorizontal />} title={t("adjForm.empty")} />} />
    </div>
  )
}
