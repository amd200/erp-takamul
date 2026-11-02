import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { suppliersApi } from "./service"

export const useSupplierList = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["suppliers", "list", sort] : ["suppliers", "list"], queryFn: () => suppliersApi.list(sort), placeholderData: keepPreviousData })
export const useSupplier = (id: number | undefined) => useQuery({ queryKey: ["suppliers", "detail", id ?? 0], queryFn: () => suppliersApi.get(id!), enabled: id != null })

export const useSaveSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof suppliersApi.create>[0] }) => (id ? suppliersApi.update(id, data) : suppliersApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
