import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { categoriesApi } from "./service"

export const useCategories = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["categories", "list", sort] : ["categories", "list"], queryFn: () => categoriesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof categoriesApi.create>[0] }) => (id ? categoriesApi.update(id, data) : categoriesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
