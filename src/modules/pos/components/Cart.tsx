import { useEffect, useMemo, useRef, useState } from "react"
import { CircleArrowRight, Handbag, Pause, Plus, Trash2 } from "lucide-react"
import { CurrencySymbol } from "./CurrencySymbol"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAdditions } from "@/modules/additions/queries"
import { useCustomers } from "@/modules/lookups/service"
import { invoiceTotals } from "@/modules/sales/totals"
import { useAppSettings } from "@/modules/settings"
import { cartTotals } from "../cart"
import { usePosStore } from "../store"
import { CartHeader, useOrderTypes } from "./CartHeader"
import { ItemEditor } from "./ItemEditor"
import { CART_GRID, CartLineRow } from "./CartLineRow"
import { CustomerPicker } from "./CustomerPicker"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { CheckThenDiscard } from "./CheckThenDiscard"

const TABS = ["add", "discount", "note"] as const
type Tab = (typeof TABS)[number]
const fmt = (n: number) => n.toFixed(2)

/** Puts the branch's default customer and service employee on a new sale, as the current POS does after each sale. */
export function useSaleDefaults() {
  const settings = useAppSettings()
  const { data: customers } = useCustomers()
  return () => {
    const s = usePosStore.getState()
    const id = settings.customersTab?.defultCustomar
    const c = (id ? customers?.find((x) => x.id === id) : undefined) ?? customers?.[0]
    if (c) s.setCustomer(c.id, c.customerName)
    s.setEmployee(settings.salonsTab?.defaultServiceEmployeeId ?? null)
  }
}

/** The sale being rung up, laid out like the current POS's cart panel. */
export function Cart({ onPay, onHold, onSend, busy, onShift, categoryId = null }: { onPay: () => void; onHold: () => void; busy: boolean; onShift: () => void
  /** Dine-in: sends the table's order to the kitchen (a new order, or the items added to the open one). */
  onSend: () => void
  /** The category picked on the grid: the item window then offers only that category's additions, as the current POS does. */
  categoryId?: number | null }) {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const s = usePosStore()
  const { data: customers } = useCustomers()
  const { data: additions = [] } = useAdditions()
  const defaults = useSaleDefaults()
  const { none } = useOrderTypes()
  const locked = s.save !== "idle"
  const [tab, setTab] = useState<Tab>("add")
  const [discKind, setDiscKind] = useState<"value" | "percent">("percent")
  const [discInput, setDiscInput] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const editing = s.lines.find((l) => l.key === editingKey) ?? null

  // The default customer is picked once when the screen opens; clearing it afterwards leaves it cleared.
  const picked = useRef(false)
  useEffect(() => {
    if (picked.current || !customers?.length) return
    picked.current = true
    if (!usePosStore.getState().customerId && usePosStore.getState().save === "idle") defaults()
  }, [customers, defaults])

  useEffect(() => { if (s.discount.value === 0) setDiscInput("") }, [s.discount])

  const totals = useMemo(() => cartTotals(s.lines, s.discount), [s.lines, s.discount])
  const before = useMemo(() => invoiceTotals(s.lines), [s.lines])
  const hasOrderDiscount = s.discount.value > 0
  const itemDiscounts = before.discount
  const hasItemDiscount = s.lines.some((l) => l.discount > 0)
  const exempt = settings.taxSetting?.taxSetting === "Exempt"
  const dineIn = s.orderType === "InDine"
  const canHold = settings.operationsTab?.btnHolding === true
  const sales = settings.salesScreenTab
  const canEdit = sales?.isQuantity !== false || sales?.isPrice !== false || sales?.isAddons !== false
  const empty = s.lines.length === 0

  // The current POS offers every addition on every item.
  const activeAdditions = useMemo(() => additions.filter((a) => a.isActive && (categoryId == null || (a.categories?.map((c) => c.id) ?? a.categoryIds ?? []).includes(categoryId))), [additions, categoryId])

  /** The checks the current POS makes before holding or paying. */
  const ready = () => {
    if (empty) { toast.error(t("pos1.addItems")); return false }
    if (none) { toast.error(t("pos1.noOrderType")); return false }
    if (settings.salonsTab?.showEmployeeService && !s.employeeId) { toast.error(t("pos1.chooseServiceEmployee")); return false }
    return true
  }

  const clearInvoice = () => { s.clear(); defaults(); setTab("add"); setEditingKey(null) }

  const applyDiscount = () => {
    if (hasItemDiscount) return toast.error(t("pos1.cannotMixDiscounts"))
    s.setDiscount({ kind: discKind, value: parseFloat(discInput) || 0 })
    setTab("add")
  }

  const tabLabel = (k: Tab) => (k === "add" ? t("pos1.add") : k === "discount" ? t("pos1.discount") : t("pos1.note"))

  return (
    <section aria-label={t("pos.cart")} className="flex h-full w-full max-w-full min-w-0 shrink-0 flex-col border-border lg:w-[360px] lg:border-r xl:w-[440px] 2xl:w-[550px]">
      <CartHeader onShift={onShift} />

      <div className="flex items-center gap-2 border-b border-border px-3 py-[14.75px]">
        {!s.customerId ? (
          <div className="w-full"><CustomerPicker customerId={null} name="" disabled={locked} onPick={s.setCustomer} tools={false} /></div>
        ) : (
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{s.customerName.slice(0, 2).toUpperCase()}</div>
            <span className="flex-1 truncate text-xs font-bold text-primary">{s.customerName}</span>
            <button type="button" disabled={locked} onClick={() => s.setCustomer(null, "")} className="text-base leading-none text-primary/60 hover:text-primary">×</button>
          </div>
        )}
        <Button type="button" size="icon-sm" variant="outline" disabled={locked} onClick={() => setAdding(true)} className="border-primary text-primary hover:bg-primary/10 hover:text-primary"><Plus size={14} /></Button>
      </div>

      {locked && s.save === "uncertain" && (
        <div role="alert" className="border-b bg-destructive-soft px-3 py-2 text-xs text-destructive">
          <p>{t("pos.lockedHint")}</p>
          <CheckThenDiscard onDiscarded={clearInvoice} />
        </div>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-1.5">
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center select-none">
            <Handbag size={50} className="text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground/80">{t("pos1.cartEmpty")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("pos1.startAdding")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`${CART_GRID} border-b border-border py-1.5 text-[10px] font-semibold text-faint uppercase`}>
              <span>#</span><span>{t("pos1.item")}</span><span className="text-center">{t("pos1.quantity")}</span><span className="flex items-center justify-center text-center">{t("pos1.price")}</span><span className="text-center">{t("pos1.total")}</span><span className="text-center">{t("pos1.actions")}</span>
            </div>
            <ul>{s.lines.map((l, i) => <CartLineRow key={l.key} line={l} index={i} locked={locked} onQty={(key, q) => s.setQty(key, Math.max(1, q))} onRemove={s.remove} onEdit={(k) => canEdit && setEditingKey(k)} />)}</ul>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border">
        <div className="flex items-center justify-between border-b border-border px-3">
          <div className="flex items-center">
            {TABS.map((k) => {
              const disabled = k === "discount" && hasItemDiscount
              return (
                <button key={k} type="button" disabled={disabled} onClick={() => !disabled && setTab(k)}
                  className={cn("border-b-2 px-1.5 py-2 text-xs whitespace-nowrap transition-colors duration-150", tab === k ? "border-primary font-bold text-primary" : "border-transparent text-faint hover:text-foreground", disabled && "cursor-not-allowed opacity-40")}>
                  {tabLabel(k)}
                </button>
              )
            })}
          </div>
          {settings.preparationTicketTab?.showOrderDeviceNumber && s.orderDeviceNumber && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
              <span className="text-[10px] font-bold opacity-70">{t("pos.deviceNumberShort")}:</span>
              <span className="text-sm font-black">{s.orderDeviceNumber}</span>
            </div>
          )}
        </div>

        {tab === "add" && (
          <div className="px-3 pt-2.5 pb-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className={hasOrderDiscount || itemDiscounts > 0 ? "font-semibold text-primary" : "text-muted-foreground"}>{t("pos1.discount")}</span>
              <div className="flex items-center gap-1">
                <span className={cn("text-sm font-semibold tabular-nums", hasOrderDiscount || itemDiscounts > 0 ? "text-foreground" : "text-faint")}>-{fmt(hasOrderDiscount ? totals.discount - itemDiscounts : itemDiscounts)}</span>
                {hasOrderDiscount && <button type="button" disabled={locked} onClick={() => s.setDiscount({ kind: "percent", value: 0 })} className="flex size-4 items-center justify-center rounded-full bg-muted text-xs leading-none text-muted-foreground hover:bg-gray-300">×</button>}
              </div>
            </div>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{t("pos1.subtotal")}</span>
              <div className="flex items-center gap-1.5">
                {hasOrderDiscount && <span className="text-[10px] text-faint line-through">{fmt(before.subTotal - before.discount)}</span>}
                <span className="text-sm font-semibold text-foreground tabular-nums">{fmt(totals.subTotal - totals.discount)}</span>
              </div>
            </div>
            {!exempt && (
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{t("pos1.tax")}</span>
                <div className="flex items-center gap-1.5">
                  {hasOrderDiscount && <span className="text-[10px] text-faint line-through">{fmt(before.tax)}</span>}
                  <span className="text-sm font-semibold text-foreground tabular-nums">{fmt(totals.tax)}</span>
                </div>
              </div>
            )}
            <div className="mt-2 mb-3 flex justify-between border-t border-border pt-1 text-sm font-black text-foreground">
              <span>{t("pos1.payable")}</span>
              <div className="flex items-center gap-1.5">
                {hasOrderDiscount && <span className="text-xs font-normal text-faint line-through">{fmt(before.grandTotal)}</span>}
                <span className="text-xl tabular-nums">{fmt(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={empty || locked} onClick={clearInvoice} className="h-12 w-full gap-2 px-5 text-base border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 size={16} />{t("pos1.emptyInvoice")}
              </Button>
              {dineIn ? (
                <Button type="button" variant="outline" disabled={busy || s.dineInMode === "checkout"} onClick={() => ready() && onSend()} className="h-12 w-full gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary">{t("posTables.sendToKitchen")} <Plus /></Button>
              ) : canHold && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => ready() && onHold()} className="h-12 w-full gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary">{t("pos1.holdCart")} <Pause /></Button>
              )}
              <Button type="button" disabled={busy} onClick={() => ready() && onPay()} className={cn("h-12 w-full gap-2 px-5 text-base", (canHold || dineIn) && "order-first col-span-2")}>
                {t("pos1.pay")} <CircleArrowRight />
              </Button>
            </div>
          </div>
        )}

        {tab === "discount" && (
          <div className="p-3">
            <div className="mb-3 text-sm font-bold text-foreground">{t("pos1.orderDiscount")}</div>
            <div className="mb-3 flex items-center gap-2">
              <button type="button" onClick={() => setDiscKind("value")} className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl border-2 text-base font-bold transition-all", discKind === "value" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-faint")}><CurrencySymbol size={18} /></button>
              <button type="button" onClick={() => setDiscKind("percent")} className={cn("flex h-12 min-w-12 shrink-0 px-3 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all", discKind === "percent" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-faint")}>{t("sales.kindPercent")}</button>
              <Input value={discInput} onChange={(e) => setDiscInput(e.target.value)} type="number" min="0" placeholder="0" className="h-12 flex-1 rounded-xl border border-border bg-card px-3 text-right text-sm font-semibold outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="destructive" className="h-12 flex-1 gap-2 px-5 text-base" onClick={() => { setTab("add"); s.setDiscount({ kind: "percent", value: 0 }) }}>{t("common.cancel")}</Button>
              <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" disabled={locked} onClick={applyDiscount}>{t("pos1.add")}</Button>
            </div>
          </div>
        )}

        {tab === "note" && (
          <div className="p-3">
            <textarea value={s.note} disabled={locked} onChange={(e) => s.setNote(e.target.value)} rows={2} placeholder={t("pos1.addOrderNote")} className="mb-2 w-full resize-none rounded-lg border border-border px-2.5 py-2 text-xs outline-none focus:border-primary/40" />
            <div className="flex gap-2">
              <Button type="button" variant="destructive" className="h-12 flex-1 gap-2 px-5 text-base" onClick={() => s.setNote("")}>{t("common.clear")}</Button>
              <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={() => setTab("add")}>{t("common.save")}</Button>
            </div>
          </div>
        )}
      </div>

      <CustomerDialog open={adding} onOpenChange={setAdding} onCreated={(id, name) => s.setCustomer(id, name)} />
      <ItemEditor line={editing} additions={activeAdditions} onClose={() => setEditingKey(null)} onQty={s.setQty} onPatch={s.patchLine} />
    </section>
  )
}
