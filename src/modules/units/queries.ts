import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { unitsApi } from "./service"
import { unitKeys } from "./keys"

export const useUnits = (sort?: ListSort) => useQuery({ queryKey: unitKeys.list(sort), queryFn: () => unitsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveUnit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof unitsApi.create>[0] }) => (id ? unitsApi.update(id, data) : unitsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: unitKeys.all })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteUnit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unitsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: unitKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
