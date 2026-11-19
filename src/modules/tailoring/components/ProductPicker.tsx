import { useState } from "react"
import { Package, ScanBarcode, Scissors, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { CurrencySymbol } from "@/modules/settings"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PRODUCTS } from "../data"
import { useTailoringStore } from "../store"
import { PRODUCT_CATEGORIES, type ProductCategory, type TailorProduct } from "../types"
import { GarmentIcon } from "./GarmentIcon"

/**
 * The shop's products by category, with a search by name or barcode (a scanned barcode plus Enter adds it). A tailoring
 * product adds a piece to cut and sew; a ready product is added as a line with a quantity.
 */
export function ProductPicker() {
  const { t, i18n } = useTranslation()
  const pieces = useTailoringStore((s) => s.pieces)
  const lines = useTailoringStore((s) => s.lines)
  const addProduct = useTailoringStore((s) => s.addProduct)
  const [cat, setCat] = useState<ProductCategory | "all">("all")
  const [term, setTerm] = useState("")

  const q = term.trim().toLowerCase()
  const shown = PRODUCTS.filter((p) => (cat === "all" || p.category === cat) && (!q || p.name.includes(q) || p.nameEn.toLowerCase().includes(q) || p.barcode.includes(q)))
  const count = (p: TailorProduct) => p.garment
    ? pieces.filter((x) => x.productId === p.id).reduce((n, x) => n + x.quantity, 0)
    : lines.find((l) => l.productId === p.id)?.quantity ?? 0

  const onEnter = () => {
    const exact = PRODUCTS.find((p) => p.barcode === term.trim()) ?? (shown.length === 1 ? shown[0] : undefined)
    if (exact) { addProduct(exact.id); setTerm(""); return }
    if (/^\d{6,}$/.test(term.trim())) toast.error(t("tailoring.products.notFound"))
  }

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter() } }}
            placeholder={t("tailoring.products.search")} aria-label={t("tailoring.products.search")} className="h-10 ps-9 pe-9" />
          <ScanBarcode className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-faint" />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
          {(["all", ...PRODUCT_CATEGORIES] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
              className={cn("shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition", cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              {t(`tailoring.products.cats.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? <p className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">{t("tailoring.products.empty")}</p> : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 2xl:grid-cols-6">
          {shown.map((p) => {
            const n = count(p)
            return (
              <button key={p.id} type="button" onClick={() => addProduct(p.id)}
                className={cn("relative flex flex-col items-center gap-1 rounded-lg border bg-card px-2 pt-4 pb-2.5 text-center transition hover:border-primary hover:shadow-sm active:scale-[0.98]", n > 0 ? "border-primary ring-1 ring-primary" : "border-primary/40")}>
                {n > 0 && <span className="absolute top-1.5 end-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{n}</span>}
                {p.garment && <span className="absolute top-1.5 start-1.5 flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"><Scissors className="size-2.5" />{t("tailoring.products.tailored")}</span>}
                {p.garment ? <GarmentIcon id={p.garment} className="size-7 text-primary" /> : <Package className="size-7 p-0.5 text-muted-foreground" />}
                <span className="line-clamp-2 text-sm font-semibold leading-tight">{i18n.language === "ar" ? p.name : p.nameEn}</span>
                <span className="flex items-center gap-1 text-xs font-bold text-primary tabular-nums">{formatMoney(p.price)} <CurrencySymbol /></span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
