import { useCallback, useMemo, useState } from "react"
import { enteredPrice, priceBeforeTaxOf, taxCalcOf } from "@/modules/products/mappers"
import type { Product } from "@/modules/products/types"
import { useTaxesEnabled } from "../hooks"
import { usePosStore } from "../store"
import type { CartLine } from "../types"
import { useBranchedItems } from "./queries"

type NewLine = Omit<CartLine, "key" | "notes" | "extras">

/** An item as a cart line. The tax rate is the one the server sends with the item, so no tax list is read; a tax-exempt branch sells at the price before tax and adds none. */
const lineOf = (p: Product, name: string, taxesEnabled: boolean): NewLine => ({
  productId: p.id, unitId: p.baseUnitId ?? 0, name, unitName: "", quantity: 1, unitPrice: taxesEnabled ? enteredPrice(p) : priceBeforeTaxOf(p),
  taxRate: taxesEnabled ? p.taxPercentage ?? 0 : 0, taxCalculation: taxesEnabled ? taxCalcOf(p) : 2, discountKind: "value", discount: 0, imageUrl: p.imageUrl ?? null, categoryId: p.categoryId ?? null,
})

/** What picking an item does: adds it, or opens the list of the items a branched item groups. */
export function useOrderActions(productName: (p: Pick<Product, "productNameAr" | "productNameEn" | "productNameUr">) => string) {
  const taxesEnabled = useTaxesEnabled()
  const add = usePosStore((s) => s.add)
  const setQty = usePosStore((s) => s.setQty)
  const lines = usePosStore((s) => s.lines)
  const [parentId, setParentId] = useState<number | null>(null)
  const branched = useBranchedItems(parentId)
  const parent = parentId != null ? branched.data ?? null : null

  const quantities = useMemo(() => {
    const m = new Map<number, number>()
    for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity)
    return m
  }, [lines])
  const quantityOf = useCallback((id: number) => quantities.get(id) ?? 0, [quantities])

  const pick = useCallback((p: Product) => {
    if (p.productType === "Branched") setParentId(p.id)
    else add(lineOf(p, productName(p), taxesEnabled))
  }, [add, productName, taxesEnabled])

  // The newest line of the item loses one; at the last piece every line of the item goes.
  const decrease = useCallback((productId: number, quantity: number) => {
    const { lines: all, remove } = usePosStore.getState()
    if (quantity <= 1) return all.filter((l) => l.productId === productId).forEach((l) => remove(l.key))
    const last = [...all].reverse().find((l) => l.productId === productId)
    if (last) setQty(last.key, last.quantity - 1)
  }, [setQty])

  // The server sends a child with its price only; it works the tax and the unit out from the item itself.
  const pickChild = (child: NonNullable<Product["children"]>[number]) =>
    add({ productId: child.id, unitId: 0, name: productName(child), unitName: "", quantity: 1, unitPrice: child.sellingPrice ?? 0, taxRate: 0, taxCalculation: 2, discountKind: "value", discount: 0, imageUrl: null })
  const childPrice = (child: NonNullable<Product["children"]>[number]) => child.sellingPrice ?? 0

  return { pick, decrease, quantityOf, parent, closeParent: () => setParentId(null), pickChild, childPrice }
}
