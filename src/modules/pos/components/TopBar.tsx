import { useState } from "react"
import { Maximize } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { showsInSales } from "@/modules/products/pricing"
import { useProductSearch } from "@/modules/products/lookup"
import type { Product } from "@/modules/products/types"
import { CashDrawerButton } from "./CashDrawerButton"

/**
 * The bar above the catalog, as in the current POS: a search box that lists matching items under it (picking one adds
 * it to the cart; the grid itself is not filtered), the full-screen button and the cash drawer button.
 */
export function TopBar({ onPick }: { onPick: (p: Product) => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const term = search.trim()
  const { data = [] } = useProductSearch(term, { enabled: term.length > 0 })
  const found = term ? data.filter((p) => showsInSales(p) && p.productType !== "RawMatrial") : []

  const toggleFull = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => undefined)
    else void document.exitFullscreen().catch(() => undefined)
  }

  return (
    <header className="flex items-center gap-3 border-b bg-card px-3 py-3 md:px-5">
      <Popover open={open && found.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Input value={search} placeholder={t("pos1.searchProducts")} aria-label={t("pos1.searchProducts")}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const hit = found.find((p) => p.barcode === term) ?? (found.length === 1 ? found[0] : undefined); if (hit) { setOpen(false); setSearch(""); onPick(hit) } } }}
              onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="h-10 w-full bg-muted ps-12 pe-5 focus:border-primary/40 dark:bg-input/30" />
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-faint">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
          </div>
        </PopoverAnchor>
        <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()} side="bottom" align="start" sideOffset={4}>
          <div className="max-h-64 overflow-y-auto">
            {found.map((p) => (
              <div key={p.id} onMouseDown={() => { setOpen(false); onPick(p) }} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.productNameAr}</p>
                  {p.productNameEn && <p className="truncate text-xs text-muted-foreground">{p.productNameEn}</p>}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button type="button" variant="outline" size="icon" title={t("pos.fullscreen")} aria-label={t("pos.fullscreen")} onClick={toggleFull}
        className="size-10 shrink-0 border-primary text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground">
        <Maximize size={18} />
      </Button>
      <CashDrawerButton className="h-10 shrink-0 border-primary px-2.5 text-primary hover:bg-primary hover:text-primary-foreground" />
    </header>
  )
}
