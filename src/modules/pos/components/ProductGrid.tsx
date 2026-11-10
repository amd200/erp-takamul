import { memo, useState } from "react"
import { Check, PackageSearch, RotateCw, Store } from "lucide-react"
import { CurrencySymbol } from "./CurrencySymbol"
import { useAppSettings } from "@/modules/settings"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/EmptyState"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { listedPrice } from "@/modules/products/mappers"
import type { Product } from "@/modules/products/types"
import { useTaxesEnabled } from "../hooks"

/** Two columns on a phone, four from tablet width, five on very wide screens, as in the current POS. */
const GRID = "grid grid-cols-2 content-start gap-2 p-3 py-2.5 sm:grid-cols-4 2xl:grid-cols-5"

/** The picture sits whole on a soft panel, like the current POS; an item without one shows its first letter. */
function Thumb({ p }: { p: Product }) {
  const [broken, setBroken] = useState(false)
  if (p.imageUrl && !broken) return <img src={p.imageUrl} alt="" onError={() => setBroken(true)} loading="lazy" className="size-full object-contain" />
  return <Store className="size-[30px] text-muted-foreground/30" strokeWidth={1.5} aria-hidden />
}

type CardProps = { product: Product; inCart: number; onPick: (p: Product) => void; nameSize: number; priceSize: number }

/** One item, as in the current POS: picture panel, name and the price with tax (before it when the branch is tax-exempt), a count badge once it is in the cart. */
const Card = memo(function Card({ product: p, inCart, onPick, nameSize, priceSize }: CardProps) {
  const exempt = !useTaxesEnabled()
  return (
    <div role="button" tabIndex={0} onClick={() => onPick(p)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(p) } }}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl border bg-card px-0 pt-1 pb-2.5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-md motion-reduce:transform-none",
        inCart > 0 ? "border-primary ring-1 ring-primary ring-inset" : "border-primary/40",
      )}>
      {inCart > 0 && <span className="absolute right-1.5 top-1.5 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums">{inCart}</span>}
      <div className="relative mx-auto mb-2 flex h-16 w-full max-w-full items-center justify-center overflow-hidden rounded-xl bg-muted/30 px-2"><Thumb p={p} /></div>
      <div className="min-w-0">
        <div className="mb-0.5 leading-tight font-semibold text-foreground" style={{ fontSize: nameSize }}>{p.productNameAr}</div>
        <div className="flex flex-row-reverse items-center justify-center gap-x-1 font-bold leading-none text-primary tabular-nums" style={{ fontSize: priceSize + 2 }}>
          <CurrencySymbol size={Math.max(9, Math.round((priceSize + 2) * 0.7))} />
          {listedPrice(p, exempt).toFixed(2)}
        </div>
      </div>
    </div>
  )
})

export function ProductGrid({ products, loading, error, onRetry, quantityOf, onPick, hasMore, loadingMore, onMore }: {
  products: Product[]; loading: boolean; error: boolean; onRetry: () => void; quantityOf: (id: number) => number; onPick: (p: Product) => void
  /** The grid shows one server page at a time; there are more when the category or search has further items. */
  hasMore: boolean; loadingMore: boolean; onMore: () => void
}) {
  const { t } = useTranslation()
  const look = useAppSettings().appearanceTab
  const sizeOf = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 12)
  const nameSize = sizeOf(look?.itemNameSize)
  const priceSize = sizeOf(look?.itemPriceSize)
  if (loading) return <div className={GRID}>{Array.from({ length: 12 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
  if (error) return <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={onRetry}>{t("common.retry")}</Button>} />
  if (!products.length) return <EmptyState icon={<PackageSearch />} title={t("pos.noItems")} hint={t("pos.noItemsHint")} />
  return (
    <>
      <div className={GRID}>
        {products.map((p) => <Card key={p.id} product={p} inCart={quantityOf(p.id)} onPick={onPick} nameSize={nameSize} priceSize={priceSize} />)}
      </div>
      {hasMore && (
        <div className="flex justify-center p-3 pt-0">
          <Button type="button" variant="outline" disabled={loadingMore} onClick={onMore}>{loadingMore ? t("common.loading") : t("common.loadMore")}</Button>
        </div>
      )}
    </>
  )
}

/**
 * A branched item stands for a group of existing items. As in the current POS the window stays open so several of them
 * can be added in a row; each one shows a tick and how many are in the cart, and Done closes it.
 */
export function ChildrenDialog({ parent, priceOf, quantityOf, onOpenChange, onPick }: {
  parent: Product | null
  priceOf: (childId: number, fallback: number) => number
  quantityOf: (childId: number) => number
  onOpenChange: (o: boolean) => void
  onPick: (childId: number) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={!!parent} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 pt-5 pb-3">
          <DialogTitle className="text-sm font-black">{parent?.productNameAr}</DialogTitle>
          <DialogDescription className="sr-only">{t("pos.chooseHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto px-4 py-3">
          {(parent?.children ?? []).map((c) => {
            const qty = quantityOf(c.id)
            return (
              <button key={c.id} type="button" onClick={() => onPick(c.id)}
                className={cn("flex w-full items-center justify-between gap-4 rounded-xl border px-3 py-2.5 transition-all duration-150 active:scale-[0.98]",
                  qty > 0 ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "hover:border-primary/50 hover:bg-primary/5")}>
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  {qty > 0 && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" strokeWidth={3} /></span>}
                  <span className="truncate">{c.productNameAr}</span>
                  {qty > 0 && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground tabular-nums">×{qty}</span>}
                </span>
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary tabular-nums">{formatMoney(priceOf(c.id, c.sellingPrice ?? 0))}</span>
              </button>
            )
          })}
        </div>
        <div className="px-4 pt-2 pb-4">
          <button type="button" className="w-full rounded-lg py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => onOpenChange(false)}>{t("common.cancel")}</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
