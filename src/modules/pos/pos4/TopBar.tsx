import { useState } from "react"
import { Maximize, Minimize, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useDebounced } from "@/modules/products/lookup"
import type { Product } from "@/modules/products/types"
import { usePos4Items } from "./queries"

/** The wide screen's top: a search box that lists matches to pick from, and the full-screen button. */
export function TopBar({ nameOf, onPick }: { nameOf: (p: Product) => string; onPick: (p: Product) => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState(!!document.fullscreenElement)

  // The server searches (a name, or a barcode); an empty box lists nothing.
  const term = useDebounced(search.trim())
  const found = usePos4Items({ categoryId: null, term, enabled: !!term }).items

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
      setFull(!!document.fullscreenElement)
    } catch { /* the browser may refuse; the screen works the same either way */ }
  }

  return (
    <header className="flex items-center gap-3 border-b bg-card px-3 py-3 md:px-5">
      <Popover open={open && found.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
            <Input value={search} aria-label={t("pos4.searchProducts")} placeholder={t("pos4.searchProducts")}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="h-10 w-full rounded-sm bg-[#f6f6f6] ps-10 pe-5 text-sm font-normal focus:border-primary/40 dark:bg-input/30" />
          </div>
        </PopoverAnchor>
        <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()} side="bottom" align="start" sideOffset={4}>
          <div className="max-h-64 overflow-y-auto">
            {found.map((p) => (
              <div key={p.id} onMouseDown={() => { setOpen(false); onPick(p) }} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{nameOf(p)}</p>
                  {p.productNameEn && <p className="truncate text-xs text-muted-foreground">{p.productNameEn}</p>}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" size="icon-lg" className="size-10 shrink-0 rounded-[10px] border-primary bg-card text-primary hover:bg-primary/5 hover:text-primary" aria-label={t("pos4.fullscreen")} title={t("pos4.fullscreen")} onClick={toggleFull}>{full ? <Minimize /> : <Maximize />}</Button>
    </header>
  )
}
