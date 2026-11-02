import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { usersApi } from "./service"

export const useUsers = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["users", "list", sort] : ["users", "list"], queryFn: () => usersApi.list(sort), placeholderData: keepPreviousData })

export const useSaveUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof usersApi.create>[0] }) => (id ? usersApi.update(id, data) : usersApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useRoleNames = () => useQuery({ queryKey: ["users", "role-names"], queryFn: usersApi.roleNames, staleTime: 5 * 60_000 })
