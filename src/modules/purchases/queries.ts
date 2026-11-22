import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { purchasesApi } from "./service"
import type { PurchaseInput } from "./types"
import { purchaseKeys } from "./keys"
import { supplierKeys } from "@/modules/suppliers/keys"
import { treasuryKeys } from "@/modules/treasuries/keys"
import { productKeys } from "@/modules/products/keys"

export const usePurchasePage = (q: { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }) =>
  useQuery({ queryKey: purchaseKeys.page(q), queryFn: () => purchasesApi.page(q), placeholderData: keepPreviousData })
/** The latest purchase number plus one, keeping its prefix ("PO-B1-000041" → "PO-B1-000042"); the server gives the real number on saving. */
export const useNextPurchaseNumber = () => useQuery({
  queryKey: purchaseKeys.nextNumber,
  queryFn: async () => {
    const numbers = (await purchasesApi.page({ page: 1, pageSize: 20 })).items.map((p) => p.purchaseOrderNumber ?? "").filter(Boolean)
    const last = numbers.sort((a, b) => b.localeCompare(a))[0]
    if (!last) return null
    const cut = last.lastIndexOf("-") + 1
    return `${last.slice(0, cut)}${String((parseInt(last.slice(cut), 10) || 0) + 1).padStart(6, "0")}`
  },
  refetchOnWindowFocus: true,
})
export const usePurchase = (id: number | undefined) => useQuery({ queryKey: purchaseKeys.detail(id ?? 0), queryFn: () => purchasesApi.get(id!), enabled: !!id })

/** A purchase moves stock, supplier balances and treasuries, so all of those refresh with it. */
function useRefresh() {
  const qc = useQueryClient()
  return () => { for (const queryKey of [purchaseKeys.all, supplierKeys.all, treasuryKeys.all, productKeys.all]) qc.invalidateQueries({ queryKey }) }
}

export function useSavePurchase() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, data, key }: { id?: number; data: PurchaseInput; key: string }) => (id ? purchasesApi.update(id, data) : purchasesApi.create(data, key)),
    onSuccess: () => { refresh(); toast.success(i18n.t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

/** Adding, changing or deleting a payment moves the purchase's paid / remaining, the supplier balance and the treasury. */
export function usePaymentMutation<V>(fn: (v: V) => Promise<unknown>, doneKey: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { refresh(); toast.success(i18n.t(doneKey)) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}
export const useRecordPurchasePayment = () => usePaymentMutation(({ id, ...p }: { id: number; treasuryId: number; amount: number; paymentDate?: string; notes?: string }) => purchasesApi.recordPayment(id, p), "purchases.paymentSaved")
export const useDeletePurchasePayment = () => usePaymentMutation((paymentId: number) => purchasesApi.deletePayment(paymentId), "common.deleted")

export function useCancelPurchase() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => purchasesApi.cancel(id),
    onSuccess: () => { refresh(); toast.success(i18n.t("purchases.cancelled")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
