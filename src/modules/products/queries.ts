import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { productsApi } from "./service"
import type { ProductQuery, SaveOptions } from "./types"
import { PRODUCT_TYPES, type ProductInput, type ProductType } from "./types"

/** Reads `?type=` from the edit link and ignores anything that is not a real kind. */
export const parseProductType = (v: string | null): ProductType | undefined => PRODUCT_TYPES.find((x) => x === v)

export const productKeys = {
  all: ["products"] as const,
  page: (q: ProductQuery) => ["products", "page", q] as const,
  detail: (id: number, type?: ProductType) => ["products", "detail", id, type ?? null] as const,
}

/** The list screen: keeps the previous page on screen while the next one loads. */
export const useProductPage = (q: ProductQuery) =>
  useQuery({ queryKey: productKeys.page(q), queryFn: () => productsApi.page(q), placeholderData: keepPreviousData })

export const useProduct = (id: number | undefined, type?: ProductType) =>
  useQuery({ queryKey: productKeys.detail(id ?? 0, type), queryFn: () => productsApi.get(id!, type), enabled: id != null })

export function useSaveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, opts }: { id?: number; data: ProductInput; opts: SaveOptions }) => productsApi.save(data, id, opts),
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
