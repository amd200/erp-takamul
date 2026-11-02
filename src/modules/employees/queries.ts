import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { employeesApi } from "./service"

export const useEmployeeList = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["employees", "list", sort] : ["employees", "list"], queryFn: () => employeesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveEmployee = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof employeesApi.create>[0] }) => (id ? employeesApi.update(id, data) : employeesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteEmployee = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
