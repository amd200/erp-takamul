import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Category } from "@/modules/categories/types"
import { showsInSales } from "@/modules/products/mappers"
import type { Product } from "@/modules/products/types"
import { useAppSettings } from "@/modules/settings"
import { usePos4Categories, usePos4Products } from "./queries"
import type { ProductGroup } from "./types"

/** A sized setting, or its fallback when it holds no usable number. */
const size = (v: unknown, fallback: number) => (Number(v) > 0 ? Number(v) : fallback)

/** An item filed under a branched item: it is sold through its parent, not as a card of its own on a wide screen. */
const isBranchChild = (p: Product) => !!p.parentProductId && (p.productType === "Direct" || p.productType === "Prepared")

/** The menu of the customer's ordering screen: the main categories, what each shows, and the sizes the branch set. */
export function useCatalog(search: string, currentCat: number | null) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const sales = useAppSettings().appearanceTab ?? {}
  const products = usePos4Products()
  const categories = usePos4Categories()
  const items = products.data
  const main = categories.data

  const productName = useCallback((p: Pick<Product, "productNameAr" | "productNameEn">) => (lang === "en" ? p.productNameEn || p.productNameAr : p.productNameAr), [lang])
  const categoryName = useCallback((c: Category) => (lang === "en" ? c.categoryNameEn || c.categoryNameAr : c.categoryNameAr), [lang])

  // No category is open (all items) until one is picked.
  const activeCategoryId = main?.some((c) => c.id === currentCat) ? currentCat : null

  const matches = useCallback((p: Product) => {
    const term = search.trim().toLowerCase()
    return !term || [p.productNameAr, p.productNameEn, p.barcode].some((v) => v?.toLowerCase().includes(term))
  }, [search])

  // A wide screen shows one category at a time (every category while searching).
  const filtered = useMemo(() => {
    const searching = !!search.trim()
    return (items ?? []).filter((p) => showsInSales(p) && p.productType !== "RawMatrial" && !isBranchChild(p) && (searching ? matches(p) : activeCategoryId == null || p.categoryId === activeCategoryId))
  }, [items, search, matches, activeCategoryId])

  // A phone lists every category's items on one page. A branched item is not a card there: the items it groups are,
  // under its category, provided the branched item itself is on the sales screen.
  const groups = useMemo<ProductGroup<Product>[]>(() => {
    const byCategory = new Map<number, ProductGroup<Product>>((main ?? []).map((c) => [c.id, { id: c.id, name: categoryName(c), products: [] }]))
    const branchedParents = new Map((items ?? []).filter((p) => p.productType === "Branched" && showsInSales(p)).map((p) => [p.id, p]))
    for (const p of items ?? []) {
      if (p.productType === "RawMatrial" || p.productType === "Branched" || !matches(p)) continue
      const parent = p.parentProductId ? branchedParents.get(p.parentProductId) : undefined
      if (!(parent && isBranchChild(p)) && !showsInSales(p)) continue
      const categoryId = parent?.categoryId ?? p.categoryId
      if (categoryId != null) byCategory.get(categoryId)?.products.push(p)
    }
    return [...byCategory.values()].filter((g) => g.products.length > 0)
  }, [items, main, categoryName, matches])

  const typography = useMemo(() => {
    const productPrice = size(sales.itemPriceSize, 12)
    return {
      category: size(sales.categorySize, 14), productName: size(sales.itemNameSize, 12), productPrice,
      subItemName: size(sales.subItemNameSize, 12), subItemPrice: size(sales.subItemPriceSize, 12), priceIcon: Math.max(10, productPrice - 2),
    }
  }, [sales])

  return {
    items, main, filtered, groups, activeCategoryId, typography, productName, categoryName,
    loading: products.isLoading || categories.isLoading,
    error: products.isError || categories.isError,
    retry: () => { void products.refetch(); void categories.refetch() },
  }
}

/** What a card shows: the price with tax, as the server sends it. */
export const shownPrice = (p: Pick<Product, "priceAfterTax" | "sellingPrice">) => p.priceAfterTax ?? p.sellingPrice ?? 0
