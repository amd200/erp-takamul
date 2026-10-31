import { useState } from "react"
import { Link } from "react-router-dom"
import { Edit2, ShieldCheck, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
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
  const { data, isLoading } = useRoles()
  const { data: users = [] } = useUsers()
  const del = useDeleteRole()
  const [toDelete, setToDelete] = useState<Role | null>(null)
  const usersOf = (r: Role) => users.filter((u) => u.roleName === r.roleName).length

  const columns: Column<Role>[] = [
    { id: "name", header: t("oldRoles.roleName"), cell: (r) => r.roleName },
    { id: "count", header: t("oldRoles.count"), cell: (r) => r.permissions.length },
    ...(can(P.roles.manage) ? [{ id: "actions", header: t("oldRoles.actions"), cell: (r: Role) => (
      <div className="space-x-2 rtl:space-x-reverse">
        <Link to={`/roles/${r.roleId}`} className="btn-minimal-action btn-edit" aria-label={t("common.edit")}><Edit2 size={16} /></Link>
        <button type="button" onClick={() => setToDelete(r)} className="btn-minimal-action btn-delete" aria-label={t("common.delete")}><Trash2 size={16} /></button>
      </div>
    ) }] : []),
  ]

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl leading-snug font-bold">{t("oldRoles.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("oldRoles.subtitle")}</p>
          </div>
          <Can perm={P.roles.manage}><Button asChild><Link to="/roles/create">{t("oldRoles.add")}</Link></Button></Can>
        </div>
        <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(r) => r.roleId}
          searchText={(r) => r.roleName} searchPlaceholder={t("oldRoles.search")}
          empty={<EmptyState icon={<ShieldCheck />} title={t("oldRoles.empty")} />} />
      </div>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("roles.deleteTitle")}
        description={toDelete && usersOf(toDelete) > 0 ? t("roles.deleteInUse", { name: toDelete.roleName, count: usersOf(toDelete) }) : t("roles.deleteBody", { name: toDelete?.roleName })}
        onConfirm={() => toDelete && del.mutate(toDelete.roleName, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
