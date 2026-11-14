import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { usersApi } from "./service"
import { userKeys } from "./keys"

export const useUsers = (sort?: ListSort) => useQuery({ queryKey: userKeys.list(sort), queryFn: () => usersApi.list(sort), placeholderData: keepPreviousData })

export const useSaveUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof usersApi.create>[0] }) => (id ? usersApi.update(id, data) : usersApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ employeeId, currentPassword, password }: { employeeId: number;    currentPassword: string; password: string }) => usersApi.changePassword(employeeId, currentPassword, password),
    onSuccess: () => toast.success(i18n.t("common.saved")),
    onError: (e) => errorToast(e, "common.saveFailed"),
  })

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useRoleNames = () => useQuery({ queryKey: userKeys.roleNames, queryFn: usersApi.roleNames, staleTime: 5 * 60_000 })
