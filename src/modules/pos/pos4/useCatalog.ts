import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Category } from "@/modules/categories/types"
import { useDebounced } from "@/modules/products/lookup"
import { listedPrice } from "@/modules/products/mappers"
import type { Product } from "@/modules/products/types"
import { useAppSettings } from "@/modules/settings"
import { usePos4Categories, usePos4Items } from "./queries"

/** A sized setting, or its fallback when it holds no usable number. */
const size = (v: unknown, fallback: number) => (Number(v) > 0 ? Number(v) : fallback)

/** The menu of the customer's ordering screen: the main categories, what each shows, and the sizes the branch set. */
export function useCatalog(search: string, currentCat: number | null, phone: boolean) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const sales = useAppSettings().appearanceTab ?? {}
  const categories = usePos4Categories()
  const main = categories.data
  const term = useDebounced(search.trim())

  const productName = useCallback((p: Pick<Product, "productNameAr" | "productNameEn" | "productNameUr">) => (lang === "bn" ? p.productNameUr || p.productNameEn || p.productNameAr : lang === "en" ? p.productNameEn || p.productNameAr : p.productNameAr), [lang])
  const categoryName = useCallback((c: Category) => (lang === "bn" ? c.categoryNameUr || c.categoryNameEn || c.categoryNameAr : lang === "en" ? c.categoryNameEn || c.categoryNameAr : c.categoryNameAr), [lang])

  // No category is open (all items) until one is picked.
  const activeCategoryId = main?.some((c) => c.id === currentCat) ? currentCat : null

  // A wide screen shows one category at a time (every category while searching); a phone loads each category's section
  // when it comes into view (see Products), and only a search is loaded here.
  const list = usePos4Items({ categoryId: term ? null : activeCategoryId, term, enabled: !phone || !!term })

  const typography = useMemo(() => {
    const productPrice = size(sales.itemPriceSize, 12)
    return {
      category: size(sales.categorySize, 14), productName: size(sales.itemNameSize, 12), productPrice,
      subItemName: size(sales.subItemNameSize, 12), subItemPrice: size(sales.subItemPriceSize, 12), priceIcon: Math.max(10, productPrice - 2),
    }
  }, [sales])

  return {
    main, list, searching: !!term, activeCategoryId, typography, productName, categoryName,
    loading: list.loading || categories.isLoading,
    error: list.error || categories.isError,
    retry: () => { list.retry(); void categories.refetch() },
  }
}

/** What a card shows: the price with tax. */
export const shownPrice = (p: Pick<Product, "priceAfterTax" | "sellingPrice">) => listedPrice(p)
