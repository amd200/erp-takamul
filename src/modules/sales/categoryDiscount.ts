import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { discountsApi } from "@/modules/settings/lists/service"
import type { InvoiceLine } from "./types"

/**
 * The server replaces a sold item's own discount with the active discount of its category (a percentage, or a flat amount
 * per unit), so the screen has to show the same. It has no "which are active" call for this, so the list is read once.
 */
export function useCategoryDiscountOf() {
  const { data } = useQuery({ queryKey: ["category-discounts", "active"], queryFn: async () => (await discountsApi.list()).filter((d) => d.isActive), staleTime: 5 * 60_000 })
  return useCallback((categoryId: number | null | undefined): Pick<InvoiceLine, "categoryDiscount"> => {
    // More than one active discount on a category: the server takes the first.
    const d = categoryId == null ? undefined : data?.find((x) => x.categoryId === categoryId)
    return d ? { categoryDiscount: { kind: d.discountType === "Percentage" ? "percent" : "value", value: d.discountValue } } : {}
  }, [data])
}
