import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { rememberProduct, useProductSearch } from "../lookup"
import { useFindByBarcode } from "../queries"
import type { Product, ProductType } from "../types"

/**
 * An input you type in to find an item and add it, as in the current system: the list opens under the field as you
 * type (name, with the barcode small under it), Enter on a barcode adds that item straight away, and the field clears
 * after each pick. The server does the searching, one small page at a time.
 */
export function ProductSearchInput({ onPick, accept, type, placeholder }: {
  onPick: (p: Product) => void
  accept?: (p: Product) => boolean
  type?: ProductType
  placeholder: string
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { mutateAsync: findByBarcode } = useFindByBarcode()
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data, isFetching } = useProductSearch(term, { type, enabled: open })
  const items = (data ?? []).filter((p) => !accept || accept(p))

  const pick = (p: Product) => { rememberProduct(qc, p); onPick(p); setTerm(""); setOpen(false) }
  const onEnter = async () => {
    const code = term.trim()
    if (!code) return
    const found = await findByBarcode({ code, accept })
    if (found) pick(found.product)
    else if (!items.length) toast.error(t("sales.noItemFound"))
  }

  return (
    <div ref={box} className="relative" onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <Input value={term} placeholder={placeholder} aria-label={placeholder} autoComplete="off" className="h-10"
        onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
          if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); void onEnter() }
        }} />
      {open && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {items.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{isFetching ? t("common.loading") : t("sales.noItemFound")}</li>}
          {items.map((p) => (
            <li key={p.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="flex w-full flex-col rounded-sm px-3 py-1.5 text-start text-sm hover:bg-accent">
                <span>{p.productNameAr}</span>
                {p.barcode && <span className="mt-0.5 text-[10px] text-muted-foreground" dir="ltr">{p.barcode}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
