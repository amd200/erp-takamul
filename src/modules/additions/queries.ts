import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { additionsApi } from "./service"
import { additionKeys } from "./keys"

export const useAdditions = (sort?: ListSort) => useQuery({ queryKey: additionKeys.list(sort), queryFn: () => additionsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveAddition = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof additionsApi.create>[0] }) => (id ? additionsApi.update(id, data) : additionsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: additionKeys.all })
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
      qc.invalidateQueries({ queryKey: additionKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
