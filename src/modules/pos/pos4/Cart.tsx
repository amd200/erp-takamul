import { useMemo, useState } from "react"
import { Handbag, Plus, Trash2 } from "lucide-react"
import { CurrencySymbol } from "../shared/CurrencySymbol"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAdditions } from "@/modules/additions/queries"
import { useAppSettings } from "@/modules/settings"
import { lineAmounts } from "@/modules/sales/totals"
import { toast } from "sonner"
import { cartTotals } from "../cart"
import { CART_GRID, CartLineRow } from "../shared/CartLineRow"
import { ItemEditor } from "../shared/ItemEditor"
import { NumberPromptDialog } from "../shared/NumberPromptDialog"
import { useSaveSale } from "../queries"
import { usePosStore } from "../store"

/** What the server is given for the customer and the stock on this screen: it has no sign-in to read them from. */
const WALK_IN_CUSTOMER = 1
const MAIN_WAREHOUSE = 1

/**
 * The customer's order: the lines, the totals and Send. With `onContinueShopping` it is the phone's full-screen cart,
 * whose lines are cards with a picture; otherwise the wide screen's table beside the menu.
 */
export function Cart({ onContinueShopping }: { onContinueShopping?: () => void }) {
  const { t, i18n } = useTranslation()
  const sales = useAppSettings().salesScreenTab ?? {}
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const lines = usePosStore((s) => s.lines)
  const locked = usePosStore((s) => s.save) !== "idle"
  const setQty = usePosStore((s) => s.setQty)
  const remove = usePosStore((s) => s.remove)
  const patchLine = usePosStore((s) => s.patchLine)
  const { data: additions = [] } = useAdditions()
  const save = useSaveSale({ message: t("pos4.orderCreated") })

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)
  const editing = lines.find((l) => l.key === editingKey) ?? null

  const totals = useMemo(() => cartTotals(lines, { kind: "value", value: 0 }), [lines])
  const phone = !!onContinueShopping
  const canEdit = sales.isQuantity !== false || sales.isAddons !== false

  // Which additions an item takes depends on its category.
  const additionsFor = (line: { categoryId?: number | null }) => {
    const category = line.categoryId ?? null
    return additions.filter((a) => a.isActive && (a.categoryIds.length === 0 || (category != null && a.categoryIds.includes(category))))
  }

  const send = (tableNumber: string | null) => {
    save.mutate({ sale: {
      orderType: "TakeAway", orderTypeName: null, orderDeviceNumber: null, tableNumber, customerId: WALK_IN_CUSTOMER, deliveryCompanyId: null, employeeId: null, warehouseId: MAIN_WAREHOUSE,
      lines, discount: { kind: "value", value: 0 }, note: "", holding: true, holdingOrderId: null, payments: [],
      posDeviceName: new URLSearchParams(location.search).get("posDeviceName"),
    } }, { onSuccess: () => setConfirmOpen(false) })
  }

  const start = () => {
    if (lines.length === 0) return toast.error(t("pos4.addItemsToInvoice"))
    if (sales.selectTableNumberDuringSave) setTableOpen(true)
    else setConfirmOpen(true)
  }

  const sendButton = (
    <Button type="button" size="lg" onClick={start} disabled={save.isPending} className="h-12 w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90">
      {t("pos4.sendOrder")} <Plus />
    </Button>
  )

  return (
    <div className="flex h-full w-full max-w-full min-w-0 shrink-0 flex-col border-border lg:w-[360px] lg:border-r xl:w-[440px] 2xl:w-[550px]">
      <div className={cn("flex-1 space-y-1 overflow-y-auto px-2 py-1.5", lines.length === 0 && "flex h-full flex-col items-center justify-center")}>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center select-none">
            <Handbag size={50} className="text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground/80">{t("pos4.cartEmpty")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("pos4.startAdding")}</p>
            </div>
          </div>
        ) : phone ? (
          <div className="-mx-2 -my-1.5" dir={i18n.dir()}>
            {lines.map((l) => {
              const unit = l.quantity > 0 ? lineAmounts(l).total / l.quantity : 0
              return (
                <article key={l.key} className="flex min-h-32 gap-4 border-b border-border bg-card px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col items-start py-1 text-start">
                    <h3 className="text-base leading-7 font-bold text-foreground">{l.productName}</h3>
                    {l.extras.length > 0 && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">+ {l.extras.map((e) => e.name).join("، ")}</p>}
                    <div className="mt-auto flex flex-row-reverse items-center gap-1 font-bold text-foreground">
                      <CurrencySymbol size={13} />
                      <span>{formatMoney(unit)}</span>
                    </div>
                  </div>
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted/40">
                    {l.imageUrl ? <img src={l.imageUrl} alt={l.productName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted-foreground/40"><Handbag size={30} /></div>}
                    <div className="absolute right-2 bottom-2 left-2 flex h-8 items-center justify-between rounded-lg border border-border bg-card px-1 text-foreground shadow-sm" dir="ltr">
                      <button type="button" disabled={locked} onClick={() => setQty(l.key, l.quantity + 1)} aria-label={t("pos4.increaseQuantity")} className="flex size-7 items-center justify-center rounded-md hover:bg-primary/10 hover:text-primary disabled:opacity-40"><Plus size={16} strokeWidth={2.5} /></button>
                      <span className="min-w-6 text-center text-xs font-bold tabular-nums">{l.quantity}</span>
                      <button type="button" disabled={locked} onClick={() => remove(l.key)} aria-label={t("common.delete")} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div role="table" aria-label={t("pos.cart")}>
            <div role="row" className={`${CART_GRID} border-b py-1.5 text-[10px] font-semibold text-faint`}>
              <span>#</span><span>{t("products.item")}</span><span className="text-center">{t("products.quantity")}</span><span className="text-center">{t("pos.price")}</span><span className="text-center">{t("shifts.lineTotal")}</span><span className="text-center">{t("common.actions")}</span>
            </div>
            <ul>{lines.map((l, i) => <CartLineRow key={l.key} line={l} index={i} locked={locked} onQty={setQty} onRemove={remove} onEdit={(key) => canEdit && setEditingKey(key)} />)}</ul>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border">
        <div className="px-3 pt-2.5 pb-3">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>{t("pos4.subtotal")}</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{formatMoney(totals.subTotal - totals.discount)}</span>
          </div>
          {taxSetting !== "Exempt" && (
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{t("pos4.tax")}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{formatMoney(totals.tax)}</span>
            </div>
          )}
          <div className="mt-2 mb-3 flex justify-between border-t border-border pt-1 text-sm font-black text-foreground">
            <span>{t("pos4.payable")}</span>
            <span className="text-xl tabular-nums">{formatMoney(totals.grandTotal)}</span>
          </div>

          {phone ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="lg" onClick={onContinueShopping} className="h-12 w-full border-border bg-muted/50 font-bold text-foreground hover:bg-muted">{t("pos4.addItems")}</Button>
              {sendButton}
            </div>
          ) : sendButton}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pos4.confirmSendTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pos4.confirmSendMsg")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={save.isPending} onClick={(e) => { e.preventDefault(); send(null) }}>{save.isPending ? t("pos4.submitting") : t("pos4.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <NumberPromptDialog open={tableOpen} onOpenChange={setTableOpen} title={t("pos4.selectTableNumber")} initial={null} onConfirm={send} />
      <ItemEditor hidePrice line={editing} additions={editing ? additionsFor(editing) : []} onClose={() => setEditingKey(null)} onQty={setQty} onPatch={patchLine} />
    </div>
  )
}
