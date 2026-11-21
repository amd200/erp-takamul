import { useState, type ReactNode } from "react"
import { enteredPrice } from "../pricing"
import { useTranslation } from "react-i18next"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatMoney } from "@/lib/format"
import { rememberProduct, useProductSearch } from "../lookup"
import type { Product, ProductType } from "../types"
import { useQueryClient } from "@tanstack/react-query"

/**
 * A button that opens a search list of items. Typing asks the server for matches (one small page), so it works the
 * same with ten items or fifty thousand. `accept` hides items the screen cannot use; `price` picks the price shown.
 */
export function ProductSearchPicker({ onPick, accept, type, price = (p) => enteredPrice(p), align = "start", children }: {
  onPick: (p: Product) => void
  accept?: (p: Product) => boolean
  type?: ProductType
  price?: (p: Product) => number
  align?: "start" | "center" | "end"
  /** The trigger, usually a Button. */
  children: ReactNode
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const { data, isFetching } = useProductSearch(term, { type, enabled: open })
  const items = (data ?? []).filter((p) => !accept || accept(p))

  const close = () => { setOpen(false); setTerm("") }

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-80 p-0">
        {/* The server already filtered, so the list does not filter again. */}
        <Command shouldFilter={false}>
          <CommandInput value={term} onValueChange={setTerm} placeholder={t("sales.searchItem")} />
          <CommandList>
            <CommandEmpty>{isFetching ? t("common.loading") : t("sales.noItemFound")}</CommandEmpty>
            <CommandGroup>
              {items.map((p) => (
                <CommandItem key={p.id} value={String(p.id)} onSelect={() => { rememberProduct(qc, p); onPick(p); close() }}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.productNameAr}</span>
                    {p.barcode && <span className="block text-[10px] text-muted-foreground"><bdi dir="ltr">{p.barcode}</bdi></span>}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(price(p))}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
