import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { warehousesApi } from "./service"
import type { WarehouseInput } from "./types"
import { warehouseKeys } from "./keys"

export const useWarehouseList = (sort?: ListSort) =>
  useQuery({ queryKey: sort?.SortBy ? [...warehouseKeys.list, sort] : warehouseKeys.list, queryFn: () => warehousesApi.list(sort), placeholderData: keepPreviousData })

export function useSaveWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: WarehouseInput }) =>
      id ? warehousesApi.update(id, data) : warehousesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeleteWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => warehousesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
