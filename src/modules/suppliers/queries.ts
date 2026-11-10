import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { suppliersApi } from "./service"
import { supplierKeys } from "./keys"

export const useSupplierList = (sort?: ListSort) => useQuery({ queryKey: supplierKeys.list(sort), queryFn: () => suppliersApi.list(sort), placeholderData: keepPreviousData })
export const useSupplier = (id: number | undefined) => useQuery({ queryKey: supplierKeys.detail(id ?? 0), queryFn: () => suppliersApi.get(id!), enabled: id != null })

export const useSaveSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof suppliersApi.create>[0] }) => (id ? suppliersApi.update(id, data) : suppliersApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all })
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
      qc.invalidateQueries({ queryKey: supplierKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
