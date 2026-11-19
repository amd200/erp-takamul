import { PackageSearch, Store } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CurrencySymbol } from "@/modules/settings"
import { cn } from "@/lib/utils"
import { PRODUCTS } from "../data"
import { useTailoringStore } from "../store"
import type { ProductCategory, TailorProduct } from "../types"
import { GarmentIcon } from "./GarmentIcon"

const GRID = "grid grid-cols-2 content-start gap-2 p-3 py-2.5 sm:grid-cols-4 2xl:grid-cols-5"

/** The items as cards, like the sales screen's grid; a tailoring item carries a small "tailoring" tag. */
export function ProductGrid({ category }: { category: ProductCategory | null }) {
  const { t, i18n } = useTranslation()
  const pieces = useTailoringStore((s) => s.pieces)
  const lines = useTailoringStore((s) => s.lines)
  const addProduct = useTailoringStore((s) => s.addProduct)
  const shown = PRODUCTS.filter((p) => category == null || p.category === category)
  const count = (p: TailorProduct) => p.garment
    ? pieces.filter((x) => x.productId === p.id).reduce((n, x) => n + x.quantity, 0)
    : lines.find((l) => l.productId === p.id)?.quantity ?? 0

  if (!shown.length) return <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground"><PackageSearch size={36} className="opacity-30" /><p className="text-sm">{t("tailoring.products.empty")}</p></div>
  return (
    <div className={GRID}>
      {shown.map((p) => {
        const n = count(p)
        return (
          <div key={p.id} role="button" tabIndex={0} onClick={() => addProduct(p.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addProduct(p.id) } }}
            className={cn("relative cursor-pointer overflow-hidden rounded-xl border bg-card px-0 pt-1 pb-2.5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-md motion-reduce:transform-none",
              n > 0 ? "border-primary ring-1 ring-primary ring-inset" : "border-primary/40")}>
            {n > 0 && <span className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums">{n}</span>}
            {p.garment && <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t("tailoring.products.tailored")}</span>}
            <div className="relative mx-auto mb-2 flex h-16 w-full max-w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30 px-2">
              {p.garment ? <GarmentIcon id={p.garment} className="size-9 text-primary" /> : <Store className="size-[30px] text-muted-foreground/30" strokeWidth={1.5} aria-hidden />}
            </div>
            <div className="min-w-0">
              <div className="mb-0.5 leading-tight font-semibold text-foreground" style={{ fontSize: 12 }}>{i18n.language === "ar" ? p.name : p.nameEn}</div>
              <div className="flex flex-row-reverse items-center justify-center gap-x-1 font-bold leading-none text-primary tabular-nums" style={{ fontSize: 14 }}>
                <CurrencySymbol size={10} />{p.price.toFixed(2)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
