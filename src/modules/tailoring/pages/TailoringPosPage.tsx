import { useState } from "react"
import { ShoppingBag, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatMoney } from "@/lib/format"
import { CategoryBar } from "../components/CategoryBar"
import { OrderCart } from "../components/OrderCart"
import { OrdersBoard } from "../components/OrdersBoard"
import { ProductGrid } from "../components/ProductGrid"
import { TailorRail } from "../components/TailorRail"
import { TopBar } from "../components/TopBar"
import { itemCount, orderTotals, useTailoringStore } from "../store"
import type { ProductCategory } from "../types"

/**
 * The tailoring shop's order screen (/pos-tailoring), laid out like the sales screen: the rail on the navy frame, the
 * search, categories and items, and the cart. A piece to sew takes its fabric, colour and cut details from its row in the
 * cart; the customer's measurements open from the cart; pay takes the dates and the deposit. Look only for now: it runs
 * on sample data and keeps orders in memory, since the back end has no tailoring data.
 */
export default function TailoringPosPage() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<ProductCategory | null>(null)
  const [boardOpen, setBoardOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const pieces = useTailoringStore((s) => s.pieces)
  const lines = useTailoringStore((s) => s.lines)
  const count = itemCount(pieces, lines)
  const cart = <OrderCart />

  return (
    // A navy frame around one rounded panel, as in the sales screen: the rail sits on the frame, the catalog and the cart inside the panel.
    <div className="relative flex h-dvh overflow-hidden bg-brand-navy py-2">
      <TailorRail onOrders={() => setBoardOpen(true)} onNew={() => useTailoringStore.getState().clear()} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-sidebar ltr:rounded-tl-[28px] rtl:rounded-tr-[28px]">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-main)]">
            <div className="overflow-hidden bg-[var(--bg-main)] ltr:rounded-tl-[28px] rtl:rounded-tr-[28px]"><TopBar onOrders={() => setBoardOpen(true)} /></div>
            <div className="h-full flex-1 overflow-y-auto">
              <CategoryBar activeId={category} onSelect={setCategory} />
              <ProductGrid category={category} />
            </div>
          </div>
          <div className="hidden h-full shrink-0 lg:block">{cart}</div>
        </div>
      </div>

      {/* On a phone the cart opens from a floating dock, as in the sales screen. */}
      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/85 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3 px-2">
            <div className="relative flex items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary">
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-white">{count}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">{t("pos1.totalItems")}</span>
              <div className="flex items-baseline gap-1 text-base font-black text-foreground"><span>{formatMoney(orderTotals(pieces, lines).total)}</span><span className="text-[10px] font-normal text-muted-foreground">{t("pos1.sar")}</span></div>
            </div>
          </div>
          <button type="button" onClick={() => setCartOpen(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary/95 active:scale-95">
            <span>{t("pos.viewCart")}</span>
            <svg className="size-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      )}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent showCloseButton={false} className="top-auto bottom-0 left-0 flex h-[85vh] max-h-[85vh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-[32px] border-x-0 border-t border-border bg-background p-0 sm:max-w-none lg:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-4">
            <DialogTitle className="text-base font-bold text-foreground">{t("pos.cart")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos.cart")}</DialogDescription>
            <button type="button" onClick={() => setCartOpen(false)} aria-label={t("pos1.close")} className="flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-90"><X size={16} strokeWidth={2.5} /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">{cart}</div>
        </DialogContent>
      </Dialog>

      <OrdersBoard open={boardOpen} onOpenChange={setBoardOpen} />
    </div>
  )
}
