import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import type { PosPayment } from "@/modules/pos/types"
import { orderRequestsApi } from "./service"

export const orderRequestKeys = { all: ["order-requests"] as const, page: (q: object) => ["order-requests", "page", q] as const, detail: (id: number) => ["order-requests", "detail", id] as const }

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
      for (const k of ["order-requests", "sales", "treasuries", "customers"]) qc.invalidateQueries({ queryKey: [k] })
      toast.success(i18n.t("orderRequests.checkedOut"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}
