import { useEffect, useMemo, useState } from "react"
import { ArrowRight, ChevronRight, ShoppingCart } from "lucide-react"
import { CurrencySymbol } from "../components/CurrencySymbol"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/modules/settings"
import { cartCount, cartTotals } from "../cart"
import { usePosBeauty } from "../hooks"
import { usePosStore } from "../store"
import { CategoryBar } from "../pos4/CategoryBar"
import { Cart } from "../pos4/Cart"
import { ChildrenDialog } from "../pos4/ChildrenDialog"
import { Header } from "../pos4/Header"
import { MobileSearch } from "../pos4/MobileSearch"
import { Products } from "../pos4/Products"
import { TopBar } from "../pos4/TopBar"
import { usePublicBranch } from "../pos4/queries"
import { useCatalog } from "../pos4/useCatalog"
import { usePhone } from "../pos4/usePhone"
import { useMenuNavigation } from "../pos4/useMenuNavigation"
import { useOrderActions } from "../pos4/useOrderActions"
import "../pos4/pos4.css"

/**
 * The customer's own ordering screen: no sign-in and no cashier. The customer picks items from the menu and sends the
 * order, which is saved on hold for the cashier to take payment. A phone shows the menu as one scrolling page with the
 * cart in a full-screen sheet; a wide screen shows one category at a time with the cart beside it.
 */
export default function Pos4Page() {
  const { t } = useTranslation()
  usePosBeauty()
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const [currentCat, setCurrentCat] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [cartOpen, setCartOpen] = useState(false)

  const phone = usePhone()
  const catalog = useCatalog(search, currentCat, phone)
  const actions = useOrderActions(catalog.productName)
  const nav = useMenuNavigation({ currentCat, setCurrentCat, main: catalog.main })
  const branch = usePublicBranch().data

  const lines = usePosStore((s) => s.lines)
  const itemCount = cartCount(lines)
  const total = useMemo(() => cartTotals(lines, { kind: "value", value: 0 }).grandTotal, [lines])
  const branchName = branch?.name || t("pos4.branchName")
  const { typography } = catalog

  // An empty cart has nothing to show in the sheet.
  useEffect(() => { if (itemCount === 0) setCartOpen(false) }, [itemCount])

  return (
    <div className={cn("pos4-shell relative flex h-dvh overflow-hidden bg-[var(--bg-main)] lg:bg-brand-navy lg:py-2", beauty && "beauty")}>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-sidebar lg:mx-2 lg:rounded-lg rtl:lg:rounded-tr-[28px] ltr:lg:rounded-tl-[28px]">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-main)] lg:overflow-y-auto">
            <div className="hidden overflow-hidden bg-[var(--bg-main)] lg:block">
              <TopBar nameOf={catalog.productName} onPick={actions.pick} />
            </div>

            <div ref={nav.menuRef} className="pos4-menu h-full min-h-0 flex-1 overflow-y-auto">
              <Header branch={branch} itemCount={itemCount} onOpenCart={() => setCartOpen(true)}>
                <CategoryBar categories={catalog.main} activeId={catalog.activeCategoryId} stripRef={nav.stripRef} onScroll={nav.scroll}
                  onSelect={nav.selectCategory} nameOf={catalog.categoryName}
                  categoryFont={typography.category} phoneFont={Math.max(typography.productName, 16)} />
              </Header>
              <MobileSearch search={search} onSearch={setSearch} />
              <Products phone={phone} searching={catalog.searching} main={catalog.main} categoryName={catalog.categoryName} list={catalog.list} hasCart={itemCount > 0} typography={typography} nameOf={catalog.productName}
                quantityOf={actions.quantityOf} onSelect={actions.pick} onDecrease={actions.decrease} registerSection={nav.registerSection} />
            </div>
          </div>

          <div className="hidden h-full shrink-0 lg:block"><Cart /></div>

          <Dialog open={cartOpen} onOpenChange={setCartOpen}>
            <DialogContent showCloseButton={false}
              className="h-dvh max-h-dvh w-full max-w-none gap-0 rounded-none border-0 bg-background p-0 ring-0 focus:outline-none sm:max-w-none lg:hidden [&>div:first-child]:hidden">
              <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
                <div className="relative flex min-h-20 shrink-0 items-center justify-center border-b border-border bg-card px-14 py-3 text-center">
                  <button type="button" onClick={() => setCartOpen(false)} aria-label={t("pos4.back")}
                    className="absolute start-4 flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ltr:rotate-180">
                    <ArrowRight size={18} strokeWidth={2} />
                  </button>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg leading-6 font-extrabold text-foreground">{t("pos4.cart")}</DialogTitle>
                    <DialogDescription className="truncate text-xs text-muted-foreground">{branchName}</DialogDescription>
                  </div>
                </div>
                <div className="min-h-0 flex-1 bg-background"><Cart onContinueShopping={() => setCartOpen(false)} /></div>
              </div>
            </DialogContent>
          </Dialog>

          {itemCount > 0 && (
            <div className="pos4-cart-bar-wrap fixed inset-x-3 bottom-4 z-40 lg:hidden">
              <button type="button" onClick={() => setCartOpen(true)}
                className="pos4-cart-bar flex w-full items-center justify-between gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
                <span className="pos4-checkout-label">
                  <ChevronRight size={16} aria-hidden="true" className="ltr:rotate-180" />
                  {t("pos4.completeOrder")}
                </span>
                <span className="pos4-cart-total">
                  <span>{t("pos4.total")}</span>
                  <strong className="flex items-center justify-center gap-1" dir="ltr"><CurrencySymbol size={14} /> {total.toFixed(2)}</strong>
                </span>
                <span className="pos4-cart-count">
                  <ChevronRight size={14} aria-hidden="true" className="ltr:rotate-180" />
                  <span>{t("pos4.items", { count: itemCount })}</span>
                  <ShoppingCart size={23} aria-hidden="true" />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ChildrenDialog parent={actions.parent} nameOf={catalog.productName} priceOf={actions.childPrice} quantityOf={actions.quantityOf}
        nameFont={typography.subItemName} priceFont={typography.subItemPrice} onClose={actions.closeParent} onPick={actions.pickChild} />
    </div>
  )
}
