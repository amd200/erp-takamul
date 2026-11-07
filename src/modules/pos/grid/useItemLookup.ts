import { useCallback, useMemo, useState } from "react"
import { showsInSales } from "@/modules/products/mappers"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { findByBarcode, rememberProduct, searchProducts, useProductSearch, useProductsByIds } from "@/modules/products/lookup"
import type { Product } from "@/modules/products/types"
import { useAppSettings, useAppSettingsQuery } from "@/modules/settings"
import { useSellLine, type SellLine } from "../hooks"
import { matchesScaleCode, readScale, scaleRule } from "../scale"
import type { SearchOption } from "./ItemSearch"

const sellable = (p: Product) => showsInSales(p) && p.productType !== "RawMatrial" && p.productType !== "Branched"

/** The cart line for a scanned or typed code: an exact barcode on an item or a sale unit, or a scale label (weight or price). */
export function useCodeLookup(taxesEnabled = true) {
  const qc = useQueryClient()
  const toLine = useSellLine(taxesEnabled)
  const settings = useAppSettings()
  const scale = useMemo(() => scaleRule(settings), [settings])

  return useCallback(async (code: string): Promise<SellLine | null> => {
    const c = code.trim()
    if (!c) return null
    const label = scale && readScale(c, scale)
    if (label) {
      // The item's own barcode may have lost the label's leading zeros, so the search uses the code without them.
      const items = await searchProducts(qc, label.itemCode.replace(/^0+/, "") || label.itemCode)
      const p = items.find((x) => sellable(x) && matchesScaleCode(x.barcode ?? "", label.itemCode))
      if (p) {
        rememberProduct(qc, p)
        return { ...toLine(p, label.price != null ? { price: label.price } : {}), quantity: label.quantity }
      }
    }
    const hit = await findByBarcode(qc, c, sellable)
    if (!hit) return null
    rememberProduct(qc, hit.product)
    return hit.unit ? toLine(hit.product, { unitId: hit.unit.unitId, price: hit.unit.sellingPrice ?? 0 }) : toLine(hit.product)
  }, [qc, scale, toLine])
}

/**
 * How the second sales screen finds items: names and codes are searched on the server (see products/lookup), and the
 * items already on the invoice are read by id, so the whole catalog is never loaded.
 */
export function useItemLookup(lineProductIds: number[], readLines?: boolean) {
  const { i18n } = useTranslation()
  const qc = useQueryClient()
  const settings = useAppSettingsQuery()
  // The placeholder can belong to another branch. Wait for the current branch's settings.
  const taxesEnabled = settings.data != null && !settings.isPlaceholderData && settings.data.taxSetting?.taxSetting !== "Exempt"
  const toLine = useSellLine(taxesEnabled)
  const byCode = useCodeLookup(taxesEnabled)

  const [typed, setTyped] = useState("")
  const found = useProductSearch(typed, { enabled: typed.trim() !== "" })
  const results = useMemo(() => (typed.trim() === "" ? [] : (found.data ?? []).filter(sellable)), [typed, found.data])

  const options = useMemo<SearchOption[]>(
    () => results.map((p) => ({ id: p.id, name: i18n.language === "bn" ? p.productNameUr || p.productNameEn || p.productNameAr : i18n.language === "en" && p.productNameEn ? p.productNameEn : p.productNameAr, code: p.barcode ?? "", price: p.priceAfterTax ?? p.sellingPrice ?? 0 })),
    [results, i18n.language],
  )

  /** The cart line for an item picked from the list of the last search. */
  const lineFor = useCallback((id: number): SellLine | null => {
    const p = results.find((x) => x.id === id)
    if (!p) return null
    rememberProduct(qc, p)
    return toLine(p)
  }, [results, qc, toLine])

  // The items on the invoice, read only when the screen shows something that comes from the item itself: the units
  // to switch to, or the cost price. Held orders and quotations bring lines this screen never searched.
  const { map } = useProductsByIds(lineProductIds, readLines)
  const productOf = useCallback((id: number) => map.get(id), [map])

  return { options, searching: found.isFetching, onQuery: setTyped, lineFor, byCode, productOf }
}
