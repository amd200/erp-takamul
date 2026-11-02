import { memo } from "react"
import { Flame, Minus, Plus, Store } from "lucide-react"
import { CurrencySymbol } from "../components/CurrencySymbol"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { Product } from "@/modules/products/types"
import { shownPrice } from "./useCatalog"
import type { ProductGroup } from "./types"

type Typography = { productName: number; productPrice: number; priceIcon: number }

type CardProps = {
  item: Product
  name: string
  typography: Typography
  quantity: number
  onSelect: (p: Product) => void
  onDecrease: (productId: number, quantity: number) => void
}

/** A card on a wide screen: the picture on a soft panel, the name and the price; a frame once it is in the cart. */
const Card = memo(function Card({ item, name, typography, quantity, onSelect }: CardProps) {
  const { t } = useTranslation()
  const added = quantity > 0
  return (
    <div role="button" tabIndex={0} aria-label={name} onClick={() => onSelect(item)}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(item) } }}
      className={cn("relative cursor-pointer overflow-hidden rounded-xl border bg-card px-0 pt-1 pb-2.5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-md motion-reduce:transform-none",
        added ? "border-primary ring-1 ring-primary ring-inset" : "border-primary/40")}>
      {added && <span className="absolute top-1.5 right-1.5 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums" aria-label={t("pos4.inCart", { count: quantity })}>{quantity}</span>}
      <div className="relative mx-auto mb-2 flex h-16 w-full max-w-full items-center justify-center overflow-hidden rounded-lg bg-muted/30 px-2">
        {item.imageUrl ? <img src={item.imageUrl} alt={name} className="h-full w-full object-contain" /> : <Store className="text-muted-foreground/30" size={30} />}
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 leading-tight font-semibold text-foreground" style={{ fontSize: typography.productName }}>{name}</div>
        <div className="flex flex-row-reverse items-center justify-center gap-x-1 font-bold text-primary" style={{ fontSize: typography.productPrice + 2 }}>
          <CurrencySymbol size={typography.priceIcon + 2} />
          {shownPrice(item).toFixed(2)}
        </div>
      </div>
    </div>
  )
})

/** A row on a phone: the price and calories on one side, the picture with the +/- control on the other. */
const MobileCard = memo(function MobileCard({ item, name, typography, quantity, onSelect, onDecrease }: CardProps) {
  const { t, i18n } = useTranslation()
  const added = quantity > 0
  return (
    <div role="button" tabIndex={0} aria-label={name} onClick={() => onSelect(item)}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(item) } }}
      className="pos4-product-card relative flex min-h-36 cursor-pointer flex-row-reverse gap-3 border-0 border-b border-border bg-card px-0 py-3 text-start transition-all duration-200 last:border-b-2 hover:bg-muted/20 motion-reduce:transform-none">
      <div className="flex w-28 shrink-0 flex-col gap-1.5">
        <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30">
          {item.imageUrl ? <img src={item.imageUrl} alt={name} className="h-full w-full object-cover" /> : <Store className="text-muted-foreground/30" size={30} />}
          <div className={cn("pos4-quantity absolute bottom-2 left-2 z-10 flex h-8 items-center overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-sm", !added && "pos4-quantity--empty w-8 justify-center")} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="flex size-8 shrink-0 items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary" aria-label={t("pos4.increaseQuantity")}
              onClick={(e) => { e.stopPropagation(); onSelect(item) }}><Plus size={17} strokeWidth={2.5} /></button>
            {added && (
              <>
                <span className="min-w-7 px-1 text-center text-xs font-bold tabular-nums">{quantity}</span>
                <button type="button" className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={quantity <= 1 ? t("common.delete") : t("pos4.decreaseQuantity")}
                  onClick={(e) => { e.stopPropagation(); onDecrease(item.id, quantity) }}><Minus size={17} strokeWidth={2.5} /></button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="pos4-product-content flex min-w-0 flex-1 flex-col py-0.5" dir={i18n.language === "en" ? "ltr" : "rtl"}>
        <div className="mb-0.5 leading-tight font-bold text-foreground" style={{ fontSize: Math.max(typography.productName, 16) }}>{name}</div>
        {item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>}
        <div className="pos4-product-meta mt-2 flex items-center justify-start gap-3 font-bold" dir="rtl">
          <span className="flex flex-row-reverse items-center gap-x-1 text-primary" style={{ fontSize: typography.productPrice + 2 }}>
            <CurrencySymbol size={typography.priceIcon + 2} />
            {shownPrice(item).toFixed(2)}
          </span>
          {item.calories != null && (
            <span className="pos4-calories" dir="rtl">
              <span>{t("pos4.calories", { count: item.calories })}</span>
              <Flame size={13} aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

/** The items: a grid of the open category on a wide screen, every category's section one under another on a phone. */
export function Products({ filtered, groups, hasCart, typography, nameOf, quantityOf, onSelect, onDecrease, registerSection }: {
  filtered: Product[]
  groups: ProductGroup<Product>[]
  hasCart: boolean
  typography: Typography
  nameOf: (p: Product) => string
  quantityOf: (id: number) => number
  onSelect: (p: Product) => void
  onDecrease: (productId: number, quantity: number) => void
  registerSection: (id: number, el: HTMLElement | null) => void
}) {
  const card = (p: Product) => ({ item: p, name: nameOf(p), typography, quantity: quantityOf(p.id), onSelect, onDecrease })
  return (
    <div className={cn("flex flex-col px-3 lg:grid lg:grid-cols-4 lg:gap-2 lg:p-3 lg:py-2.5 2xl:grid-cols-5", hasCart && "pb-28 lg:pb-2.5")}>
      {groups.map((g) => (
        <section key={g.id} id={`pos4-category-${g.id}`} ref={(el) => registerSection(g.id, el)} className="pos4-product-group scroll-mt-[108px] lg:hidden">
          <h2 className="-mx-3 border-t-[0.5px] border-border px-3 py-3 font-extrabold text-foreground" style={{ fontSize: Math.max(typography.productName, 16) }}>{g.name}</h2>
          {g.products.map((p) => <MobileCard key={p.id} {...card(p)} />)}
        </section>
      ))}
      <div className="hidden lg:contents">
        {filtered.map((p) => <Card key={p.id} {...card(p)} />)}
      </div>
    </div>
  )
}
