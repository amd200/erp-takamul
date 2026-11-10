import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { refreshAccessToken } from "@/shared/http/client"
import { rolesApi } from "./service"
import type { RoleInput } from "./types"
import { roleKeys } from "./keys"
import { userKeys } from "@/modules/users/keys"

export const useRoles = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? [...roleKeys.list, sort] : roleKeys.list, queryFn: () => rolesApi.list(sort), placeholderData: keepPreviousData })
export const useRole = (roleId: string | undefined) => useQuery({ queryKey: roleKeys.detail(roleId ?? ""), queryFn: () => rolesApi.get(roleId!), enabled: !!roleId })

/**
 * Adds a role, or sets the permissions of an existing one. Roles also live in the signed-in user's token, so it is
 * renewed afterwards (the user may have just changed their own role); a failure there does not undo the save.
 */
export function useSaveRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId?: string; data: RoleInput }) => {
      await (roleId ? rolesApi.update(roleId, data.permissions) : rolesApi.create(data.roleName ?? "", data.permissions))
      await refreshAccessToken().catch(() => undefined)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: roleKeys.all }); qc.invalidateQueries({ queryKey: userKeys.all }); toast.success(i18n.t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleName: string) => rolesApi.remove(roleName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: roleKeys.all }); toast.success(i18n.t("common.deleted")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
