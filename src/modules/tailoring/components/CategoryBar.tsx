import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { PRODUCT_CATEGORIES, type ProductCategory } from "../types"

/** The categories in one scrollable row, as in the sales screen: no "all" chip; pressing the chosen one again shows every item. */
export function CategoryBar({ activeId, onSelect }: { activeId: ProductCategory | null; onSelect: (c: ProductCategory | null) => void }) {
  const { t } = useTranslation()
  const row = useRef<HTMLDivElement>(null)
  const scroll = (dir: "left" | "right") => row.current?.scrollBy({ left: dir === "left" ? 150 : -150, behavior: "smooth" })
  const arrow = "flex size-8 shrink-0 items-center justify-center rounded-full border bg-card transition-all hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  return (
    <div className="border-b p-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => scroll("left")} className={arrow}><ChevronRight size={15} className="text-muted-foreground" /></button>
        <div ref={row} className="flex gap-1.5 overflow-x-auto scroll-smooth [scrollbar-width:none]">
          {PRODUCT_CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={c === activeId} onClick={() => onSelect(c === activeId ? null : c)} style={{ fontSize: 14 }}
              className={cn("inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-9.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                c === activeId ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40")}>
              {t(`tailoring.products.cats.${c}`)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => scroll("right")} className={arrow}><ChevronLeft size={15} className="text-muted-foreground" /></button>
      </div>
    </div>
  )
}
