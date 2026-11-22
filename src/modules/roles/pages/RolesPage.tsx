import { PageBox } from "@/components/PageBox"
import { useState } from "react"
import { Link } from "react-router-dom"
import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RowActions } from "@/components/RowActions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useUsers } from "@/modules/users/queries"
import { useDeleteRole, useRoles } from "../queries"
import type { Role } from "../types"

/** Permissions (roles), laid out as in the current system: a titled box with an add button, and a table of name and count. */
export default function RolesPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useRoles({ SortBy: sortBy, SortDescending: sortDescending })
  const { data: users = [] } = useUsers()
  const del = useDeleteRole()
  const [toDelete, setToDelete] = useState<Role | null>(null)
  const usersOf = (r: Role) => users.filter((u) => u.roleName === r.roleName).length

  const columns: Column<Role>[] = [
    { id: "roleName", sortable: true, header: t("oldRoles.roleName"), cell: (r) => r.roleName },
    { id: "count", sortable: true, /* computed from `permissions`; the server returns no count field */ sortKey: "permissionsCount", header: t("oldRoles.count"), cell: (r) => r.permissions.length },
    ...(can(P.roles.manage) ? [{ id: "actions", header: t("oldRoles.actions"), cell: (r: Role) => (
      <RowActions editTo={`/roles/${r.roleId}`} onDelete={() => setToDelete(r)} />
    ) }] : []),
  ]

  return (
    <>
      <PageBox title={t("oldRoles.title")} subtitle={t("oldRoles.subtitle")}
        action={<Can perm={P.roles.manage}><Button asChild><Link to="/roles/create">{t("oldRoles.add")}</Link></Button></Can>}>
        <DataTable sort={sort} rows={data} loading={isLoading} columns={columns} rowKey={(r) => r.roleId}
          searchText={(r) => r.roleName} searchPlaceholder={t("oldRoles.search")}
          empty={<EmptyState icon={<ShieldCheck />} title={t("oldRoles.empty")} />} />
      </PageBox>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("roles.deleteTitle")}
        description={toDelete && usersOf(toDelete) > 0 ? t("roles.deleteInUse", { name: toDelete.roleName, count: usersOf(toDelete) }) : t("roles.deleteBody", { name: toDelete?.roleName })}
        onConfirm={() => toDelete && del.mutate(toDelete.roleName, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
