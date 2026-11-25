import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Addition } from "@/modules/additions/types"
import { useAppSettings } from "@/modules/settings"
import type { CartLine } from "../types"
import { Numpad } from "./Numpad"

type Tab = "qty" | "price" | "extras"

export const ClearButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex size-6 items-center justify-center rounded-full border border-border/60 text-base leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">×</button>
)

/**
 * The window a cart row opens, as in the current POS: Quantity, Price and Additions tabs (each can be switched off in
 * Settings, sales screen), a keypad, then Cancel or Done. Nothing changes until Done. The price tab is greyed out unless
 * the branch lets the cashier change prices.
 */
export function ItemEditor({ line, additions, onClose, onQty, onPatch, hidePrice = false }: {
  line: CartLine | null
  /** The customer's own ordering screen has no price tab: the customer cannot change what an item costs. */
  hidePrice?: boolean
  additions: Addition[]
  onClose: () => void
  onQty: (key: string, q: number) => void
  onPatch: (key: string, patch: Partial<CartLine>) => void
}) {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const sales = settings.salesScreenTab
  const priceDisabled = settings.itemsTab?.allowPriceChangeOnSale !== true
  const showQty = sales?.isQuantity !== false
  const showPrice = !hidePrice && sales?.isPrice !== false
  const showExtras = sales?.isAddons !== false
  const initialTab: Tab = showQty ? "qty" : showPrice ? "price" : "extras"
  const [tab, setTab] = useState<Tab>("qty")
  const [buffer, setBuffer] = useState("0")
  const [first, setFirst] = useState(true)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [extras, setExtras] = useState<number[]>([])
  const value = parseFloat(buffer) || 0

  const key = line?.key
  useEffect(() => {
    if (!line) return
    setQty(line.quantity); setPrice(line.unitPrice); setExtras(line.extras.map((e) => e.id))
    setTab(initialTab)
    setBuffer(initialTab === "qty" ? String(line.quantity) : initialTab === "price" ? String(line.unitPrice) : "0")
    setFirst(true)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const press = (k: string) => {
    if (tab === "price" && priceDisabled) return
    setBuffer((prev) => {
      if (first && k !== "del") return k === "." ? "0." : k
      if (k === "del") return prev.length > 1 ? prev.slice(0, -1) : "0"
      if (k === ".") return prev.includes(".") ? prev : prev + "."
      return prev === "0" ? k : prev + k
    })
    if (k !== "del") setFirst(false)
  }

  const switchTab = (next: Tab) => {
    if (tab === "qty") setQty(Math.max(0.000001, value))
    else if (tab === "price") setPrice(value)
    setTab(next)
    setBuffer(next === "qty" ? String(tab === "qty" ? Math.max(0.000001, value) : qty) : next === "price" ? String(tab === "price" ? value : price) : buffer)
    setFirst(true)
  }

  const done = () => {
    if (line) {
      const q = tab === "qty" ? Math.max(0.000001, value) : qty
      const p = tab === "price" && !priceDisabled ? value : price
      onQty(line.key, q)
      onPatch(line.key, {
        unitPrice: priceDisabled ? line.unitPrice : p,
        extras: additions.filter((a) => extras.includes(a.id)).map((a) => ({ id: a.id, name: a.additionNameAr })),
      })
    }
    onClose()
  }

  const clear = () => { setBuffer("0"); setFirst(true) }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    ...(showQty ? [{ key: "qty" as Tab, label: t("pos1.qty") }] : []),
    ...(showPrice ? [{ key: "price" as Tab, label: t("pos1.price") }] : []),
    ...(showExtras ? [{ key: "extras" as Tab, label: t("pos.additions"), badge: line && line.extras.length > 0 ? line.extras.length : undefined }] : []),
  ]

  return (
    <Dialog open={!!line} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-sm gap-0 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="truncate text-right text-sm font-semibold text-foreground/80">{line?.productName}</DialogTitle>
          <DialogDescription className="sr-only">{line?.productName}</DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex border-b border-border">
          {tabs.map(({ key: k, label, badge }) => {
            const disabled = k === "price" && priceDisabled
            return (
              <button key={k} type="button" disabled={disabled} onClick={() => switchTab(k)}
                className={cn("relative -mb-px flex-1 border-b-2 py-3 text-[13px] font-semibold transition-all duration-150", tab === k ? "border-primary bg-muted/50 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground", disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground")}>
                {label}
                {badge !== undefined && <span className="absolute -top-1 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none font-bold text-primary-foreground">{badge}</span>}
              </button>
            )
          })}
        </div>

        <div className="border-b border-border bg-muted/50 px-4 py-3">
          {tab === "qty" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("pos1.qty")}</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{buffer}</span>
                {!priceDisabled && <ClearButton onClick={clear} />}
              </div>
            </div>
          )}
          {tab === "price" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("pos1.unitPrice")}</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{buffer}</span>
                <span className="text-xs text-muted-foreground">{t("pos1.sar")}</span>
                <ClearButton onClick={clear} />
              </div>
            </div>
          )}
          {tab === "extras" && (additions.length === 0
            ? <p className="py-4 text-center text-xs text-muted-foreground">{t("pos1.noAdditions")}</p>
            : (
              <div className="grid grid-cols-3 gap-2">
                {additions.map((a) => {
                  const on = extras.includes(a.id)
                  return (
                    <button key={a.id} type="button" onClick={() => setExtras((x) => (on ? x.filter((id) => id !== a.id) : [...x, a.id]))}
                      className={cn("rounded-xl border px-2 py-3 text-[12px] leading-tight font-semibold transition-all duration-150 active:scale-95", on ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted/60")}>
                      {a.additionNameAr}
                    </button>
                  )
                })}
              </div>
            ))}
        </div>

        {tab !== "extras" && <div className="bg-background px-3 pt-3 pb-2"><Numpad onKey={press} disabled={tab === "price" && priceDisabled} /></div>}
        <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-4">
          <Button type="button" variant="outline" className="h-12 flex-1 gap-2 border-primary px-5 text-base text-primary hover:bg-primary/10 hover:text-primary" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={done}>{t("pos1.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
