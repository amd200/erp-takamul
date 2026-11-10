import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { productsApi } from "./service"
import type { Product, ProductQuery } from "./types"
import { PRODUCT_TYPES, type ProductInput, type ProductType } from "./types"
import { productKeys } from "./keys"

/** Reads `?type=` from the edit link and ignores anything that is not a real kind. */
export const parseProductType = (v: string | null): ProductType | undefined => PRODUCT_TYPES.find((x) => x === v)

/** The list screen: keeps the previous page on screen while the next one loads. */
export const useProductPage = (q: ProductQuery) =>
  useQuery({ queryKey: productKeys.page(q), queryFn: () => productsApi.page(q), placeholderData: keepPreviousData })

export const useProduct = (id: number | undefined, type?: ProductType) =>
  useQuery({ queryKey: productKeys.detail(id ?? 0, type), queryFn: () => productsApi.get(id!, type), enabled: id != null })

/**
 * The item a scanned or typed barcode belongs to, read on demand (`mutateAsync({ code, accept })`). `accept` picks among
 * the matches; `unit` is the sale unit the code belongs to, or null when it is the item's own barcode. Resolves null when nothing fits.
 */
export const useFindByBarcode = () =>
  useMutation({
    mutationFn: async ({ code, accept = () => true }: { code: string; accept?: (p: Product) => boolean }) => {
      const product = (await productsApi.byBarcode(code)).find(accept)
      if (!product) return null
      return { product, unit: product.barcode === code ? null : (product.units ?? []).find((u) => u.barcode === code) ?? null }
    },
  })

export function useSaveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ProductInput }) => productsApi.save(data, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: productKeys.all }); toast.success(i18n.t("common.saved")) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: productKeys.all }); toast.success(i18n.t("common.deleted")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
