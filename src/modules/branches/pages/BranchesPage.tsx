import { useState } from "react"
import { Link } from "react-router-dom"
import { Building2, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { BranchRow } from "../types"
import { SectionCard } from "@/components/SectionCard"
import { useBranchList, useDeleteBranch } from "../queries"

/** The server always refuses to delete the default branch. */
const DEFAULT_BRANCH_ID = 1

export default function BranchesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { data, isLoading } = useBranchList()
  const del = useDeleteBranch()
  const [toDelete, setToDelete] = useState<BranchRow | null>(null)

  const columns: Column<BranchRow>[] = [
    { id: "code", header: t("branches.code"), cell: (b) => <span className="font-semibold" dir="ltr">{b.code || "—"}</span> },
    { id: "name", header: t("branches.name"), cell: (b) => <div><div className="font-semibold">{b.name || "—"}</div>{b.shortName && <div className="text-xs text-muted-foreground">{b.shortName}</div>}</div> },
    { id: "phone", header: t("users.mobile"), cell: (b) => <span dir="ltr" className="text-muted-foreground">{b.phone || "—"}</span> },
    { id: "status", header: t("common.status"), cell: (b) => b.isActive == null ? <span className="text-faint">—</span> : <StatusBadge tone={b.isActive ? "success" : "danger"}>{b.isActive ? t("common.active") : t("common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (b) => <RowActions editTo={can(P.branches.edit) ? `/branches/${b.id}/edit` : undefined} viewTo={can(P.branches.view) ? `/branches/${b.id}/view` : undefined}
      onDelete={can(P.branches.delete) && b.id !== DEFAULT_BRANCH_ID ? () => setToDelete(b) : undefined} /> },
  ]

  return (
    <>
      <PageHeader title={t("branches.title")} description={t("branches.description")}
        actions={<Can perm={P.branches.add}><Button asChild size="lg"><Link to="/branches/create"><Plus />{t("branches.add")}</Link></Button></Can>} />
      <SectionCard>
        <DataTable rows={data ?? []} loading={isLoading} columns={columns} rowKey={(b) => b.id}
          searchText={(b) => `${b.code ?? ""} ${b.name ?? ""} ${b.shortName ?? ""} ${b.shortNameEn ?? ""} ${b.phone ?? ""}`} searchPlaceholder={t("branches.search")}
          empty={<EmptyState icon={<Building2 />} title={t("branches.empty")} hint={t("branches.emptyHint")} />} />
      </SectionCard>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("branches.deleteTitle")} description={t("branches.deleteBody", { name: toDelete?.name })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
