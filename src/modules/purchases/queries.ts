import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { purchasesApi } from "./service"
import type { PurchaseInput } from "./types"

export const purchaseKeys = { all: ["purchases"] as const, page: (q: object) => ["purchases", "page", q] as const, detail: (id: number) => ["purchases", "detail", id] as const }

export const usePurchasePage = (q: { page: number; pageSize: number; searchTerm?: string }) =>
  useQuery({ queryKey: purchaseKeys.page(q), queryFn: () => purchasesApi.page(q), placeholderData: keepPreviousData })
/** The latest purchase number plus one, keeping its prefix ("PO-B1-000041" → "PO-B1-000042"); the server gives the real number on saving. */
export const useNextPurchaseNumber = () => useQuery({
  queryKey: ["purchases", "next-number"],
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
  return () => { for (const k of ["purchases", "suppliers", "treasuries", "products"]) qc.invalidateQueries({ queryKey: [k] }) }
}

export function useSavePurchase() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, data, key }: { id?: number; data: PurchaseInput; key: string }) => (id ? purchasesApi.update(id, data) : purchasesApi.create(data, key)),
    onSuccess: () => { refresh(); toast.success(i18n.t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useCancelPurchase() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (id: number) => purchasesApi.cancel(id),
    onSuccess: () => { refresh(); toast.success(i18n.t("purchases.cancelled")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
