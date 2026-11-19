import { useState } from "react"
import { ClipboardList, Maximize } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { PRODUCTS } from "../data"
import { useTailoringStore } from "../store"

/**
 * The bar above the catalog, as in the sales screen: a search box that lists matching items under it (picking one adds
 * it; a scanned barcode plus Enter adds it straight away), the full-screen button and the orders board.
 */
export function TopBar({ onOrders }: { onOrders: () => void }) {
  const { t, i18n } = useTranslation()
  const addProduct = useTailoringStore((s) => s.addProduct)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const term = search.trim().toLowerCase()
  const found = term ? PRODUCTS.filter((p) => p.name.includes(term) || p.nameEn.toLowerCase().includes(term) || p.barcode.includes(term)) : []

  const pick = (id: number) => { addProduct(id); setOpen(false); setSearch("") }
  const onEnter = () => {
    const hit = PRODUCTS.find((p) => p.barcode === term) ?? (found.length === 1 ? found[0] : undefined)
    if (hit) return pick(hit.id)
    if (/^\d{6,}$/.test(term)) toast.error(t("tailoring.products.notFound"))
  }
  const toggleFull = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => undefined)
    else void document.exitFullscreen().catch(() => undefined)
  }

  return (
    <header className="flex items-center gap-3 border-b bg-card px-3 py-3 md:px-5">
      <Popover open={open && found.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <Input value={search} placeholder={t("tailoring.products.search")} aria-label={t("tailoring.products.search")}
              onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter() } }}
              onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
              className="h-10 w-full bg-[#f6f6f6] ps-12 pe-5 focus:border-primary/40 dark:bg-input/30" />
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
          </div>
        </PopoverAnchor>
        <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()} side="bottom" align="start" sideOffset={4}>
          <div className="max-h-64 overflow-y-auto">
            {found.map((p) => (
              <div key={p.id} onMouseDown={() => pick(p.id)} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i18n.language === "ar" ? p.name : p.nameEn}</p>
                  <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">{p.barcode}</p>
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
      <Button type="button" variant="outline" onClick={onOrders} className="h-10 shrink-0 border-primary px-2.5 text-primary hover:bg-primary hover:text-primary-foreground lg:hidden">
        <ClipboardList />{t("tailoring.orders")}
      </Button>
    </header>
  )
}
