import { useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { adjustmentsApi } from "./service"
import { useStockSearch } from "./queries"
import type { StockRowDto } from "./types"

/**
 * Finds an item in a warehouse, like the item search elsewhere: the list opens under the field as you type (name, with the barcode small under it), Enter on a scanned barcode adds the exact match, and the field clears after a pick.
 * Rows come straight from GET /StockInventory; one item in two warehouses is two rows.
 */
export function StockSearchInput({ onPick, accept, placeholder }: { onPick: (row: StockRowDto) => void; accept: (row: StockRowDto) => boolean; placeholder: string }) {
  const { t } = useTranslation()
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data, isFetching } = useStockSearch(term, open)
  const rows = (data ?? []).filter(accept)

  const pick = (row: StockRowDto) => { onPick(row); setTerm(""); setOpen(false) }
  const onEnter = async () => {
    const code = term.trim()
    if (!code) return
    const matches = (await adjustmentsApi.stock(code)).filter(accept).filter((r) => r.barcode === code || r.productUnits?.some((u) => u.barcode === code))
    if (matches.length === 1) pick(matches[0])
    else if (matches.length === 0 && !rows.length) toast.error(t("sales.noItemFound"))
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
          {rows.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{isFetching ? t("common.loading") : t("sales.noItemFound")}</li>}
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)} className="flex w-full flex-col rounded-sm px-3 py-1.5 text-start text-sm hover:bg-accent">
                <span>{r.productName}</span>
                {r.barcode && <span className="mt-0.5 text-[10px] text-muted-foreground"><bdi dir="ltr">{r.barcode}</bdi></span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
