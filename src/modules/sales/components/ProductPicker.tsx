import { useMemo, useState } from "react"
import { enteredPrice, taxCalcOf } from "@/modules/products/mappers"
import { ScanBarcode } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { rememberProduct, useProductSearch } from "@/modules/products/lookup"
import { useFindByBarcode } from "@/modules/products/queries"
import { useUnits } from "@/modules/units/queries"
import { useTaxes } from "@/modules/taxes/service"
import type { Product } from "@/modules/products/types"
import { useCategoryDiscountOf } from "../categoryDiscount"
import type { InvoiceLine } from "../types"

/**
 * One box to add invoice lines, as in the current system: type a name and the matching items drop down under the box
 * (searched on the server); scan or type a barcode and press Enter to add it (sale units and branch variants included).
 */
export function ProductPicker({ onAdd, purchase, noCategoryDiscount }: { onAdd: (line: InvoiceLine) => void; /** Lines that do not show a discount (quotations) do not take the category one either. */ noCategoryDiscount?: boolean; /** Buying: lines carry the cost, before tax, and raw materials can be picked. */ purchase?: boolean }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { mutateAsync: findByBarcode } = useFindByBarcode()
  const { data: units = [] } = useUnits()
  const { data: taxes = [] } = useTaxes()
  const categoryDiscountOf = useCategoryDiscountOf()
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const [notFound, setNotFound] = useState(false)

  const unitName = (id: number) => units.find((u) => u.id === id)?.name ?? ""
  const rateOf = (p: Product) => taxes.find((x) => x.id === p.taxId)?.amount ?? 0
  const base = (p: Product, unitId = p.baseUnitId ?? 0): Omit<InvoiceLine, "name" | "unitName" | "unitPrice"> =>
    ({ productId: p.id, taxId: p.taxId ?? undefined, unitId, quantity: 1, taxRate: rateOf(p), taxCalculation: purchase ? 2 : taxCalcOf(p), discountKind: "value", discount: 0, ...(purchase || noCategoryDiscount ? {} : categoryDiscountOf(p.categoryId)) })
  const priceOf = (p: Product, factor = 1) => (purchase ? (p.costPrice ?? 0) * factor : enteredPrice(p))

  // A branched item only groups existing items, and those are sold on their own, so it is not listed.
  const sellable = (p: Product) => p.isActive !== false && p.productType !== "Branched" && (purchase ? p.productType !== "Prepared" : p.productType !== "RawMatrial")
  const lineOf = (p: Product): InvoiceLine => ({ ...base(p), name: p.productNameAr, unitName: unitName(p.baseUnitId ?? 0), unitPrice: priceOf(p) })

  // Whatever is typed or scanned drops the list down (the server searches names and barcodes); Enter on an exact barcode adds it.
  const query = q.trim()
  const byName = query !== ""
  const isCode = /^\d+$/.test(query)
  const { data, isFetching } = useProductSearch(query, { enabled: byName })
  const matches = useMemo(() => (byName ? (data ?? []).filter(sellable) : []), [byName, data, purchase])

  const reset = () => { setQ(""); setActive(0); setNotFound(false) }
  const pick = (p: Product) => { rememberProduct(qc, p); onAdd(lineOf(p)); reset() }

  const enter = async () => {
    if (!query) return
    if (!isCode && matches[active]) return pick(matches[active])
    // The server looks the code up; the exact barcode (or sale-unit barcode) is picked from what it returns.
    const hit = await findByBarcode({ code: query, accept: sellable })
    if (!hit) return matches[active] ? pick(matches[active]) : setNotFound(true)
    const { product: p, unit: u } = hit
    onAdd(u
      ? { ...base(p, u.unitId), name: p.productNameAr, unitName: unitName(u.unitId), unitPrice: purchase ? priceOf(p, u.conversionFactor) : u.sellingPrice ?? 0 }
      : lineOf(p))
    reset()
  }

  return (
    <div>
      <label htmlFor="item-code" className="mb-2 block text-sm font-semibold">{t("sales.pickItem")}</label>
      <Popover open={byName}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <ScanBarcode className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="item-code" role="combobox" aria-expanded={byName} aria-autocomplete="list" value={q} aria-invalid={notFound} autoComplete="off"
              placeholder={t("sales.pickItem")}
              onChange={(e) => { setQ(e.target.value); setActive(0); setNotFound(false) }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); void enter() }
                else if (e.key === "Escape") reset()
                else if (e.key === "ArrowDown" && byName) { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)) }
                else if (e.key === "ArrowUp" && byName) { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
              }}
              className="h-10 w-full ps-9 text-start" />
          </div>
        </PopoverAnchor>
        {/* As wide as the box, white with a soft shadow; each entry is the name with its barcode under it. */}
        <PopoverContent align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-(--radix-popover-trigger-width) rounded-lg p-1 shadow-md">
          <ul role="listbox" className="max-h-72 overflow-y-auto">
            {matches.length === 0
              ? <li className="px-3 py-4 text-center text-sm text-muted-foreground">{isFetching ? t("common.loading") : t("sales.noItemFound")}</li>
              : matches.map((p, i) => (
                <li key={p.id} role="option" aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); pick(p) }} onMouseEnter={() => setActive(i)}
                  className={cn("flex w-full cursor-default flex-col rounded-md px-1.5 py-1 text-start text-sm select-none", i === active && "bg-muted")}>
                  <span>{p.productNameAr}</span>
                  {p.barcode && <span className="mt-0.5 font-mono text-[10px] text-muted-foreground"><bdi dir="ltr">{p.barcode}</bdi></span>}
                </li>
              ))}
          </ul>
        </PopoverContent>
      </Popover>
      {notFound && <span className="mt-1 block text-xs text-destructive">{t("sales.barcodeNotFound")}</span>}
    </div>
  )
}
