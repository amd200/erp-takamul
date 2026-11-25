import { useCallback, useMemo, useState } from "react"
import { ShoppingBag, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useWarehouses } from "@/modules/lookups/service"
import type { Product } from "@/modules/products/types"
import type { Shift } from "@/modules/shifts/types"
import { ShiftReportDialog } from "@/modules/shifts/components/ShiftReportDialog"
import { useCloseShift } from "@/modules/shifts/queries"
import { cartCount, cartTotals } from "../../cart"
import { Cart, useSaleDefaults } from "../../shared/Cart"
import { CategoryBar } from "../components/CategoryBar"
import { usePayStep } from "../components/PayStep"
import { PaymentScreen } from "../../payment/PaymentScreen"
import { ChildrenDialog, ProductGrid } from "../components/ProductGrid"
import { Rail } from "../components/Rail"
import { TablesScreen } from "../components/TablesScreen"
import { ShiftGate } from "../../shared/ShiftGate"
import { TopBar } from "../components/TopBar"
import { useQueryClient } from "@tanstack/react-query"
import { fetchProduct } from "@/modules/products/lookup"
import { useCodeLookup } from "../../shared/useItemLookup"
import { usePosBeauty, usePosGrid, useSellLine } from "../../hooks"
import { useSaveSale } from "../../queries"
import { useScanner } from "../../shared/useScanner"
import { useKitchenBon, type BonSale } from "../kitchenBon"
import { useInvoiceOutput } from "@/modules/sales/print/useInvoiceOutput"
import { useAppSettings } from "@/modules/settings"
import { invoicePaperOf } from "@/modules/sales/print/paper"
import { useOrderRequestMode } from "../../shared/orderRequestMode"
import { getCustomerCompanionId, usePosStore } from "../../store"
import type { PosPayment, SaleResult } from "../../types"

export default function PosPage() {
  return <ShiftGate>{(shift) => <PosScreen shift={shift} />}</ShiftGate>
}

function PosScreen({ shift }: { shift: Shift }) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const orderStep = usePayStep(() => setPayOpen(true))
  const [cartOpen, setCartOpen] = useState(false)
  const [screen, setScreen] = useState<"sales" | "tables">("sales")
  const [parent, setParent] = useState<Product | null>(null)
  const [report, setReport] = useState<Shift | null>(null)
  const [toClose, setToClose] = useState<Shift | null>(null)

  usePosBeauty()
  const qc = useQueryClient()
  const grid = usePosGrid("", categoryId)
  const toLine = useSellLine()
  const byCode = useCodeLookup()
  const defaults = useSaleDefaults()
  const { data: warehouses = [] } = useWarehouses()
  const save = useSaveSale()
  const order = useOrderRequestMode()
  const printInvoice = useInvoiceOutput()
  const paper = invoicePaperOf(useAppSettings())
  const kitchenBon = useKitchenBon()
  const closeShift = useCloseShift()

  const lines = usePosStore((s) => s.lines)
  const customerId = usePosStore((s) => s.customerId)
  const customerName = usePosStore((s) => s.customerName)
  const discount = usePosStore((s) => s.discount)
  const add = usePosStore((s) => s.add)
  const totals = useMemo(() => cartTotals(lines, discount), [lines, discount])

  const quantities = useMemo(() => {
    const m = new Map<number, number>()
    for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity)
    return m
  }, [lines])

  const pick = useCallback((p: Product) => {
    if (p.productType === "Branched") setParent(p)
    else add(toLine(p))
  }, [add, toLine])

  // The window stays open so several children can be added in a row.
  const pickChild = (id: number) => {
    void fetchProduct(qc, id).then((child) => add(toLine(child))).catch(() => undefined)
  }

  // A barcode scanner types fast and ends with Enter while no field has focus, as in the current POS.
  useScanner((code) => { void byCode(code).then((line) => line && add(line)) })

  const sale = (holding: boolean, payments: PosPayment[]) => {
    const s = usePosStore.getState()
    return {
      orderType: s.orderType, orderTypeName: s.orderTypeName, orderDeviceNumber: s.orderDeviceNumber, tableNumber: s.tableNumber, customerId: s.customerId, customerCompanionId: getCustomerCompanionId(), deliveryCompanyId: s.deliveryCompanyId, tableId: s.tableId, dineInMode: s.dineInMode, dineInOrderId: s.dineInOrderId, employeeId: s.employeeId, warehouseId: warehouses[0]?.id ?? 0,
      lines: s.lines, discount: s.discount, note: s.note, holding, holdingOrderId: s.holdingOrderId, payments,
    }
  }

  // What the preparation ticket needs, taken before the save clears the cart. Adding to a dine-in order sends only the new lines.
  const bonOf = (): Omit<BonSale, "result" | "held"> => {
    const s = usePosStore.getState()
    return { cart: s.lines, original: s.dineInMode === "add-items" ? s.originalLines : [], customerName: s.customerName, orderTypeName: s.orderType === "TakeAway" ? s.orderTypeName : null, orderDeviceNumber: s.orderDeviceNumber, tableNumber: s.dineInMode === "new-order" || s.dineInMode === "add-items" ? null : s.tableNumber, orderNumber: s.dineInOrderNumber }
  }
  const printBon = (bon: Omit<BonSale, "result" | "held">, result: SaleResult, held = false) => kitchenBon({ ...bon, result, held })

  const confirmPay = (payments: PosPayment[], print: boolean, action?: "pdf") => {
    const bon = bonOf()
    save.mutate({ sale: sale(false, payments) }, {
      onSuccess: (res) => {
        setPayOpen(false)
        defaults()
        // "Save and print" prints the saved invoice on the paper the sales screen's invoice type setting names; the preparation ticket follows it, and is printed with "save only" too.
        if (action === "pdf" && res.data?.id) printInvoice.mutate({ invoice: { id: res.data?.id }, as: "pdf", paper }, { onSettled: () => printBon(bon, res) })
        else if (print && res.data?.id) printInvoice.mutate({ invoice: { id: res.data?.id }, as: "print", paper }, { onSettled: () => printBon(bon, res) })
        else printBon(bon, res)
      },
    })
  }

  // Dine-in: the order goes to the kitchen unpaid (a new one, or the items added to the open one); the open order is paid at checkout.
  const sendToKitchen = () => {
    if (!usePosStore.getState().tableId) return void toast.error(t("posTables.chooseTable"))
    const bon = bonOf()
    save.mutate({ sale: sale(false, []) }, { onSuccess: (res) => { setCartOpen(false); defaults(); printBon(bon, res) } })
  }
  const pay = () => {
    setCartOpen(false)
    if (order.mode) return order.save()
    const s = usePosStore.getState()
    if (s.orderType !== "InDine") return orderStep.start()
    if (s.dineInMode === "checkout") setPayOpen(true)
    else sendToKitchen()
  }

  const cart = (
    <Cart categoryId={categoryId} busy={save.isPending || order.saving || (warehouses.length === 0 && !order.mode)} onShift={() => { setCartOpen(false); setReport(shift) }}
      onPay={pay} onSend={sendToKitchen}
      onHold={() => { const bon = bonOf(); save.mutate({ sale: sale(true, []) }, { onSuccess: (res) => { setCartOpen(false); defaults(); printBon(bon, res, true) } }) }} />
  )

  return (
    // A navy frame around one rounded panel, as in the current POS: the rail sits on the frame, the catalog and the cart inside the panel.
    <div className="relative flex h-dvh overflow-hidden bg-brand-navy py-2">
      <Rail screen={screen} onScreen={setScreen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-sidebar ltr:rounded-tl-[28px] rtl:rounded-tr-[28px]">
        {screen === "tables" ? (
          <div className="flex flex-1 overflow-hidden bg-[var(--bg-main)]"><TablesScreen onOpened={() => setScreen("sales")} /></div>
        ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-main)]">
            <div className="overflow-hidden bg-[var(--bg-main)] ltr:rounded-tl-[28px] rtl:rounded-tr-[28px]"><TopBar onPick={pick} /></div>
            <div className="h-full flex-1 overflow-y-auto">
              <CategoryBar categories={grid.main} activeId={categoryId} onSelect={setCategoryId} />
              <ProductGrid products={grid.shown} loading={grid.loading} error={grid.error} onRetry={grid.retry} quantityOf={(id) => quantities.get(id) ?? 0} onPick={pick}
                hasMore={grid.hasMore} loadingMore={grid.loadingMore} onMore={grid.loadMore} />
            </div>
          </div>
          <div className="hidden h-full shrink-0 lg:block">{cart}</div>
        </div>
        )}
      </div>

      {/* On a phone the cart opens from a floating dock, as in the current POS. */}
      {lines.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/85 p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3 px-2">
            <div className="relative flex items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary">
              <ShoppingBag size={20} />
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-white">{cartCount(lines)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">{t("pos1.totalItems")}</span>
              <div className="flex items-baseline gap-1 text-base font-black text-foreground"><span>{totals.grandTotal.toFixed(2)}</span><span className="text-[10px] font-normal text-muted-foreground">{t("pos1.sar")}</span></div>
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

      <ChildrenDialog parent={parent} onOpenChange={(o) => !o && setParent(null)} onPick={pickChild}
        priceOf={(_id, fallback) => fallback} quantityOf={(id) => quantities.get(id) ?? 0} />
      {orderStep.dialog}
      <PaymentScreen open={payOpen} onOpenChange={setPayOpen} total={totals.grandTotal} hasCustomer={customerId != null} customerName={customerName} pending={save.isPending} onConfirm={confirmPay} />
      <ShiftReportDialog shift={report} onOpenChange={(o) => !o && setReport(null)} onClose={setToClose} />
      <ConfirmDialog open={!!toClose} onOpenChange={(o) => !o && setToClose(null)} pending={closeShift.isPending}
        title={t("shifts.closeTitle")} description={t("shifts.closeBody", { id: toClose?.id })} confirmLabel={t("shifts.close")}
        onConfirm={() => toClose && closeShift.mutate(toClose.id, { onSuccess: () => { setToClose(null); setReport(null) } })} />
    </div>
  )
}
