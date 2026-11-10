import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { customersApi } from "./service"
import { customerKeys } from "./keys"

export const useCustomerList = (sort?: ListSort) => useQuery({ queryKey: customerKeys.list(sort), queryFn: () => customersApi.list(sort), placeholderData: keepPreviousData })
export const useCustomer = (id: number | undefined) => useQuery({ queryKey: customerKeys.detail(id ?? 0), queryFn: () => customersApi.get(id!), enabled: id != null })

export const useSaveCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof customersApi.create>[0] }) => (id ? customersApi.update(id, data) : customersApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
