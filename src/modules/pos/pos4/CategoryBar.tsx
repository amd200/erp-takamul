import { useLayoutEffect } from "react"
import type { CSSProperties, RefObject } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { Category } from "@/modules/categories/types"

/** The main categories in one scrollable strip: round chips on a wide screen, an underlined tab row on a phone. */
export function CategoryBar({ categories, activeId, stripRef, onScroll, onSelect, onSelectAll, nameOf, categoryFont, phoneFont }: {
  categories: Category[] | undefined
  activeId: number | null
  stripRef: RefObject<HTMLDivElement | null>
  onScroll: (dir: "right" | "left") => void
  onSelect: (id: number) => void
  onSelectAll: () => void
  nameOf: (c: Category) => string
  categoryFont: number
  phoneFont: number
}) {
  const { t } = useTranslation()

  // The active chip stays in view inside the strip; only the strip moves, never the product list.
  useLayoutEffect(() => {
    if (activeId === null) return
    const strip = stripRef.current
    const active = strip?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
    if (!strip || !active) return
    const box = strip.getBoundingClientRect()
    const chip = active.getBoundingClientRect()
    const left = box.left + 12
    const right = box.right - 12
    const offset = chip.width > right - left ? (chip.left + chip.right - left - right) / 2 : chip.left < left ? chip.left - left : chip.right > right ? chip.right - right : 0
    if (Math.abs(offset) < 1) return
    strip.scrollBy({ left: offset, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }, [activeId, categories, stripRef])

  const arrow = "hidden size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none lg:flex"
  return (
    <div className="pos4-categories border-border p-0 lg:border-b lg:p-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onScroll("left")} aria-label={t("pos.scrollStart")} className={arrow}><ChevronRight size={15} className="text-muted-foreground" /></button>
        <div ref={stripRef} className="flex w-full snap-x snap-proximity touch-pan-x gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth px-3 lg:px-0" style={{ scrollbarWidth: "none" }}>
          <button type="button" className="shrink-0 lg:hidden" aria-pressed={false} onClick={onSelectAll}>{t("pos4.all")}</button>
          {categories?.map((c) => (
            <button key={c.id} type="button" onClick={() => onSelect(c.id)} aria-pressed={c.id === activeId}
              className={cn(
                "-mb-px inline-flex h-11 shrink-0 snap-start items-center justify-center rounded-none border-0 border-b-2 px-4 text-sm whitespace-nowrap transition-colors [font-size:var(--category-font-size-mobile)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none lg:mb-0 lg:rounded-full lg:border lg:px-9.5 lg:[font-size:var(--category-font-size-desktop)]",
                c.id === activeId
                  ? "border-primary bg-transparent font-semibold text-primary lg:bg-primary lg:text-primary-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground lg:border-border lg:bg-card lg:hover:border-primary/40",
              )}
              style={{ "--category-font-size-mobile": `${phoneFont}px`, "--category-font-size-desktop": `${categoryFont}px` } as CSSProperties}>
              {nameOf(c)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onScroll("right")} aria-label={t("pos.scrollEnd")} className={arrow}><ChevronLeft size={15} className="text-muted-foreground" /></button>
      </div>
    </div>
  )
}
