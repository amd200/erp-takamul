import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import type { PosPayment } from "@/modules/pos/types"
import { orderRequestsApi } from "./service"
import { orderRequestKeys } from "./keys"
import type { OrderRequestInput } from "./types"
import { salesKeys } from "@/modules/sales/keys"
import { treasuryKeys } from "@/modules/treasuries/keys"
import { customerKeys } from "@/modules/customers/keys"

export const useOrderRequestPage = (q: { page: number; pageSize: number; searchTerm?: string; from?: string; to?: string; sortBy?: string; sortDescending?: boolean }) =>
  useQuery({ queryKey: orderRequestKeys.page(q), queryFn: () => orderRequestsApi.page(q), placeholderData: keepPreviousData })
export const useOrderRequest = (id: number | null) => useQuery({ queryKey: orderRequestKeys.detail(id ?? 0), queryFn: () => orderRequestsApi.get(id!), enabled: id != null })

export function useMarkReady() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderRequestsApi.markReady(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: orderRequestKeys.all }); toast.success(i18n.t("orderRequests.markedReady")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useCheckoutOrderRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payments, key }: { id: number; payments: PosPayment[]; key: string }) => orderRequestsApi.checkout(id, payments, key),
    onSuccess: () => {
      for (const queryKey of [orderRequestKeys.all, salesKeys.all, treasuryKeys.all, customerKeys.all]) qc.invalidateQueries({ queryKey })
      toast.success(i18n.t("orderRequests.checkedOut"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useSaveOrderRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: OrderRequestInput }) => (id ? orderRequestsApi.update(id, data) : orderRequestsApi.create(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: orderRequestKeys.all }); toast.success(i18n.t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeleteOrderRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => orderRequestsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: orderRequestKeys.all }); toast.success(i18n.t("common.deleted")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

