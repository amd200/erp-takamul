import { PageBox } from "@/components/PageBox"
import { useState } from "react"
import { UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RowActions } from "@/components/RowActions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useSession } from "@/shared/session/session"
import { UserDialog } from "../components/UserDialog"
import { useDeleteUser, useUsers } from "../queries"
import type { User } from "../types"

/** Users, laid out as in the current system: a titled box with an add button, and a plain table with edit and delete. */
export default function UsersPage() {
  const { t } = useTranslation()
  const can = useCan()
  const { user: me } = useSession()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useUsers({ SortBy: sortBy, SortDescending: sortDescending })
  const del = useDeleteUser()
  const [editing, setEditing] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<User | null>(null)
  const open = (u: User | null) => { setEditing(u); setDialogOpen(true) }

  const columns: Column<User>[] = [
    { id: "userName", sortKey: "userName", header: t("oldUsers.userName"), cell: (u) => u.userName },
    { id: "mobile", sortKey: "mobile", header: t("oldUsers.mobileNumber"), cell: (u) => u.mobile },
    { id: "role", sortKey: "roleName", header: t("oldUsers.permission"), cell: (u) => u.roleName || u.roles?.[0]?.roleName || "-" },
    { id: "branch", sortKey: "branchName", header: t("oldUsers.branch"), cell: (u) => u.branchName },
    { id: "multi", sortKey: "isMultiBranch", header: t("oldUsers.multiBranch"), cell: (u) => (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${u.isMultiBranch ? "bg-[#00e6821a] text-[#09ad95]" : "bg-[#f50b0b1a] text-[#b40b09]"}`}>
        {u.isMultiBranch ? t("oldUsers.enabled") : t("oldUsers.disabled")}
      </span>
    ) },
    ...(can(P.users.edit) || can(P.users.delete) ? [{ id: "actions", header: t("oldUsers.actions"), cell: (u: User) => (
      <RowActions onEdit={can(P.users.edit) ? () => open(u) : undefined} onDelete={can(P.users.delete) && u.userName !== me.name ? () => setToDelete(u) : undefined} />
    ) }] : []),
  ]

  return (
    <>
      <PageBox title={t("oldUsers.title")} subtitle={t("oldUsers.subtitle")}
        action={can(P.users.add) ? <Button onClick={() => open(null)}>{t("oldUsers.add")}</Button> : undefined}>
        <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(u) => u.id}
          searchText={(u) => `${u.firstName} ${u.userName} ${u.email} ${u.mobile}`} searchPlaceholder={t("oldUsers.search")}
          empty={<EmptyState icon={<UserRound />} title={t("oldUsers.empty")} />} />
      </PageBox>
      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("users.deleteTitle")} description={t("users.deleteBody", { name: toDelete?.firstName || toDelete?.userName })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </>
  )
}
