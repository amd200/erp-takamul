import { useCallback, useEffect, useMemo } from "react"
import { enteredPrice, showsInSales, taxCalcOf } from "@/modules/products/mappers"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useCategories } from "@/modules/categories/queries"
import { useDebounced } from "@/modules/products/lookup"
import { productKeys } from "@/modules/products/keys"
import { productsApi } from "@/modules/products/service"
import type { Product } from "@/modules/products/types"
import { useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { useCategoryDiscountOf } from "@/modules/sales/categoryDiscount"
import type { InvoiceLine } from "@/modules/sales/types"
import { useAppSettings, useAppSettingsQuery } from "@/modules/settings"

export type SellLine = Omit<InvoiceLine, "amounts"> & { imageUrl: string | null }

/** Items asked per page for the product grid. */
const GRID_PAGE = 100

/** False while the branch is tax-exempt. The placeholder can belong to another branch, so this waits for the current branch's settings. */
export function useTaxesEnabled() {
  const settings = useAppSettingsQuery()
  return settings.data != null && !settings.isPlaceholderData && settings.data.taxSetting?.taxSetting !== "Exempt"
}

/** Turns an item into a cart line: its unit, price and the tax rate of the branch. */
export function useSellLine() {
  const taxesEnabled = useTaxesEnabled()
  const taxes = useTaxes(taxesEnabled)
  const units = useUnits()
  const unitName = useCallback((id: number) => units.data?.find((u) => u.id === id)?.name ?? "", [units.data])
  const rateOf = useCallback((p: Product) => taxesEnabled ? taxes.data?.find((x) => x.id === p.taxId)?.amount ?? 0 : 0, [taxesEnabled, taxes.data])
  const categoryDiscountOf = useCategoryDiscountOf()

  return useCallback((p: Product, opts: { unitId?: number; price?: number; name?: string } = {}): SellLine => {
    const unitId = opts.unitId ?? p.baseUnitId ?? 0
    return {
      productId: p.id, unitId, name: opts.name ?? p.productNameAr, unitName: unitName(unitId), quantity: 1, unitPrice: opts.price ?? enteredPrice(p),
      taxRate: rateOf(p), taxCalculation: taxCalcOf(p), discountKind: "value", discount: 0, imageUrl: p.imageUrl ?? null,
      ...categoryDiscountOf(p.categoryId),
    }
  }, [unitName, rateOf, categoryDiscountOf])
}

/**
 * What the product grid shows: the categories, and the items of the chosen category / search, one server page at a time
 * (`loadMore` asks for the next). The whole catalog is never loaded.
 */
export function usePosGrid(search: string, categoryId: number | null) {
  const categories = useCategories()
  const term = useDebounced(search.trim())

  const main = useMemo(() => (categories.data ?? []).filter((c) => c.parentCategoryId == null).sort((a, b) => a.displayOrder - b.displayOrder), [categories.data])

  // As in the current POS, a category shows the items filed under it (not under its sub-categories).
  const grid = useInfiniteQuery({
    queryKey: productKeys.posGrid(term, categoryId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const p = await productsApi.page({ page: pageParam, pageSize: GRID_PAGE, searchTerm: term || undefined, categoryId: categoryId ?? undefined })
      return { items: p.items, more: p.totalCount > pageParam * GRID_PAGE }
    },
    getNextPageParam: (last, _all, lastParam) => (last.more ? lastParam + 1 : undefined),
    staleTime: 60_000,
  })

  const shown = useMemo(() => {
    const seen = new Set<number>()
    return (grid.data?.pages ?? []).flatMap((p) => p.items)
      // A branched item's children are reached through it, so they are not cards of their own.
      .filter((p) => showsInSales(p) && p.productType !== "RawMatrial" && !(p.parentProductId && (p.productType === "Direct" || p.productType === "Prepared")) && !seen.has(p.id) && !!seen.add(p.id))
  }, [grid.data])

  return {
    main, shown,
    loading: grid.isLoading || categories.isLoading,
    error: grid.isError || categories.isError,
    retry: () => { void grid.refetch(); void categories.refetch() },
    hasMore: !!grid.hasNextPage,
    loadingMore: grid.isFetchingNextPage,
    loadMore: () => { void grid.fetchNextPage() },
  }
}

/** Turns the salon theme on while a sales screen is open (the class goes on <html> so dialogs get it too). */
export function usePosBeauty() {
  const on = useAppSettings().salonsTab?.beautyTheme === true
  useEffect(() => {
    if (!on) return
    document.documentElement.classList.add("beauty")
    return () => document.documentElement.classList.remove("beauty")
  }, [on])
}
