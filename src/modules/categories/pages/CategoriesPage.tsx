import { useCallback, useState } from "react"
import { CornerDownLeft, FolderTree, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { RowActions } from "@/components/RowActions"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { CategoryDialog } from "../components/CategoryDialog"
import { useCategoryPage, useDeleteCategory } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { Category } from "../types"

export default function CategoriesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const { data, isLoading, isFetching } = useCategoryPage({ page: page + 1, pageSize: 20, searchTerm: search })
  const onSearch = useCallback((value: string) => { setSearch((previous) => { if (previous !== value) setPage(0); return value }) }, [])
  const del = useDeleteCategory()
  const [editing, setEditing] = useState<Category | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  // Keep every returned category, including children whose parent is on another page.
  const rows = data?.items ?? []
  const open = (c: Category | null) => { setEditing(c); setDialogOpen(true) }

  const columns: Column<Category>[] = [
    { id: "name", header: t("categories.name"), cell: (c) => c.parentCategoryId ? (
      <span className="inline-flex items-center gap-1.5 ps-4 text-muted-foreground"><CornerDownLeft className="size-3.5 text-faint ltr:-scale-x-100" />{c.categoryNameAr}</span>
    ) : <span className="font-semibold">{c.categoryNameAr}</span> },
    { id: "desc", header: t("common.description"), cell: (c) => <span className="text-muted-foreground">{c.description || "—"}</span> },
    { id: "actions", header: "", align: "end", cell: (c) => can(P.categories.manage) && <RowActions onEdit={() => open(c)} onDelete={() => setToDelete(c)} /> },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.items")]} title={t("categories.title")} description={t("categories.description")}
        actions={<Can perm={P.categories.manage}><Button size="lg" onClick={() => open(null)}><Plus />{t("categories.add")}</Button></Can>} />
      <SectionCard>
          <DataTable rows={rows} loading={isLoading} columns={columns} rowKey={(c) => c.id}
            server={{ total: data?.totalCount ?? 0, page, pageSize: data?.pageSize ?? 20, onPage: setPage, onSearch, fetching: isFetching }} searchPlaceholder={t("categories.search")}
            empty={<EmptyState icon={<FolderTree />} title={t("categories.empty")} hint={t("categories.emptyHint")} />} />
        </SectionCard>
      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("categories.deleteTitle")} description={t("categories.deleteBody", { name: toDelete?.categoryNameAr })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
