import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import type { AdditionQuery } from "./types"
import { additionsApi } from "./service"

export const useAdditions = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["additions", "list", sort] : ["additions", "list"], queryFn: () => additionsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveAddition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof additionsApi.create>[0] }) => (id ? additionsApi.update(id, data) : additionsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["additions"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteAddition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => additionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["additions"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useAdditionPage = (q: AdditionQuery) => useQuery({
  queryKey: ["additions", "page", q],
  queryFn: () => additionsApi.page(q),
  placeholderData: keepPreviousData,
})
