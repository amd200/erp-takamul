import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { BranchRow } from "../types"
import { SectionCard } from "@/components/SectionCard"
import { useBranchPage } from "../queries"

export default function BranchesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const { sort, sortBy, sortDescending } = useTableSort(() => setPage(0))
  const { data, isLoading, isFetching } = useBranchPage({ page: page + 1, pageSize: 20, searchTerm: search, sortBy, sortDescending })
  const onSearch = useCallback((value: string) => { setSearch((previous) => { if (previous !== value) setPage(0); return value }) }, [])

  const columns: Column<BranchRow>[] = [
    { id: "code", sortKey: "code", header: t("branches.code"), cell: (b) => <span className="font-semibold" dir="ltr">{b.code || "—"}</span> },
    { id: "name", sortKey: "name", header: t("branches.name"), cell: (b) => <div><div className="font-semibold">{b.name || "—"}</div>{b.shortName && <div className="text-xs text-muted-foreground">{b.shortName}</div>}</div> },
    { id: "phone", sortKey: "phone", header: t("users.mobile"), cell: (b) => <span dir="ltr" className="text-muted-foreground">{b.phone || "—"}</span> },
    { id: "status", sortKey: "isActive", header: t("common.status"), cell: (b) => b.isActive == null ? <span className="text-faint">—</span> : <StatusBadge tone={b.isActive ? "success" : "danger"}>{b.isActive ? t("common.active") : t("common.inactive")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (b) => <RowActions editTo={can(P.branches.edit) ? `/branches/${b.id}/edit` : undefined} viewTo={can(P.branches.view) ? `/branches/${b.id}/view` : undefined} /> },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.branches")]} title={t("branches.title")} description={t("branches.description")}
        actions={<Can perm={P.branches.add}><Button asChild size="lg"><Link to="/branches/create"><Plus />{t("branches.add")}</Link></Button></Can>} />
      <SectionCard>
        <DataTable rows={data?.items ?? []} loading={isLoading} columns={columns} rowKey={(b) => b.id} sort={sort} server={{ total: data?.totalCount ?? 0, page, pageSize: data?.pageSize ?? 20, onPage: setPage, onSearch, fetching: isFetching }} searchPlaceholder={t("branches.search")}
          empty={<EmptyState icon={<Building2 />} title={t("branches.empty")} hint={t("branches.emptyHint")} />} />
      </SectionCard>
    </>
  )
}
