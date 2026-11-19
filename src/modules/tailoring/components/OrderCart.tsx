import { useRef, useState } from "react"
import { Check, CircleArrowRight, Globe, Handbag, Minus, Moon, Phone, Plus, Ruler, Sun, Trash2, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PRODUCTS } from "../data"
import { filledCount, linePrice, nextOrderNumber, orderTotals, piecePrice, useTailoringStore } from "../store"
import { MEASURE_KEYS } from "../types"
import { MeasurementsDialog } from "./MeasurementsPanel"
import { NewCustomerDialog } from "./NewCustomerDialog"
import { PayDialog } from "./PayDialog"
import { PieceEditor } from "./PieceEditor"

/** The cart table's columns, as in the sales screen: number, item, quantity, price, total, delete. */
const CART_GRID = "grid grid-cols-[18px_minmax(64px,1fr)_72px_50px_60px_32px] gap-1 px-2"
const TABS = ["add", "note"] as const
type Tab = (typeof TABS)[number]
const stop = (e: React.SyntheticEvent) => e.stopPropagation()

function Qty({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = useTranslation()
  const btn = "flex size-4 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
  return (
    <div className="flex items-center justify-center gap-1" onClick={stop} onKeyDown={stop}>
      <button type="button" aria-label={t("pos.less")} disabled={value <= 1} onClick={() => onChange(value - 1)} className={btn}><Minus size={11} /></button>
      <input type="number" min="1" value={value} aria-label={t("products.quantity")} onWheel={(e) => e.currentTarget.blur()}
        onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onChange(Math.max(1, v)) }}
        className="h-6 w-7 [appearance:textfield] rounded border bg-card text-center text-xs font-semibold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <button type="button" aria-label={t("pos.more")} onClick={() => onChange(value + 1)} className={btn}><Plus size={11} /></button>
    </div>
  )
}

function Remove({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex justify-center" onClick={stop} onKeyDown={stop}>
      <button type="button" aria-label={t("common.remove")} onClick={onClick}
        className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" /></button>
    </div>
  )
}

/**
 * The order being taken, laid out like the sales screen's cart: the header, the customer (with their measurements), the
 * items table (pressing a piece to sew opens its fabric, colour and cut details), then the totals with clear and pay.
 * Pay opens the dates and the deposit.
 */
export function OrderCart() {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const s = useTailoringStore()
  const [tab, setTab] = useState<Tab>("add")
  const [term, setTerm] = useState("")
  const [finding, setFinding] = useState(false)
  const anchor = useRef<HTMLDivElement>(null)
  const [adding, setAdding] = useState(false)
  const [measuring, setMeasuring] = useState(false)
  const [paying, setPaying] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const totals = orderTotals(s.pieces, s.lines)
  const empty = s.pieces.length + s.lines.length === 0
  const filled = filledCount(s.measurements)
  const q = term.trim()
  const found = s.customers.filter((c) => !q || c.name.includes(q) || c.phone.includes(q))
  const nameOf = (id: number) => { const p = PRODUCTS.find((x) => x.id === id); return p ? (i18n.language === "ar" ? p.name : p.nameEn) : "" }
  const priceOf = (id: number) => PRODUCTS.find((x) => x.id === id)?.price ?? 0
  let row = 0

  /** The checks before paying: a customer, an item, and measurements when something is sewn. */
  const pay = () => {
    if (empty) return void toast.error(t("tailoring.needPieces"))
    if (!s.customer) return void toast.error(t("tailoring.needCustomer"))
    if (s.pieces.length > 0 && filled === 0) { setMeasuring(true); return void toast.error(t("tailoring.needMeasures")) }
    setPaying(true)
  }
  const confirm = () => {
    if (s.pieces.length > 0 && !s.delivery) return void toast.error(t("tailoring.needDelivery"))
    toast.success(t("tailoring.saved", { number: s.saveOrder() }))
    setPaying(false)
    setTab("add")
  }

  return (
    <section aria-label={t("tailoring.pieces.title")} className="flex h-full w-full max-w-full min-w-0 shrink-0 flex-col border-border bg-card lg:w-[360px] lg:border-s xl:w-[440px] 2xl:w-[550px]">
      <div className="flex min-w-0 shrink-0 items-center justify-between gap-1 border-b border-border px-2 py-3">
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={t("topbar.language")}><Globe className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {LANGUAGES.map((l) => <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)} className="flex items-center justify-between"><span>{l.label}</span>{i18n.language === l.code && <Check size={14} className="text-primary" />}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-xs" aria-label={t("topbar.theme")}>{resolved === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}</Button></DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuItem onClick={() => setChoice("light")}><Sun className="size-3.5" />{t("pos1.lightMode")}{resolved === "light" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChoice("dark")}><Moon className="size-3.5" />{t("pos1.darkMode")}{resolved === "dark" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-primary px-2.5 text-[11px] font-semibold text-primary">
          {t("tailoring.orderNo")}<span dir="ltr" className="tabular-nums">{nextOrderNumber(s.orders)}</span>
        </span>
      </div>

      <div className="border-b border-border px-3 py-[14.75px]">
        <div className="flex items-center gap-2">
          {!s.customer ? (
            <Popover open={finding} onOpenChange={setFinding}>
              <PopoverAnchor asChild>
                <div ref={anchor} className="w-full">
                  <Input value={term} onChange={(e) => { setTerm(e.target.value); setFinding(true) }} onFocus={() => setFinding(true)}
                    placeholder={t("tailoring.customer.search")} aria-label={t("tailoring.customer.search")} className="h-8 text-xs" />
                </div>
              </PopoverAnchor>
              <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }} onOpenAutoFocus={(e) => e.preventDefault()} onInteractOutside={(e) => { if (anchor.current?.contains(e.target as Node)) e.preventDefault() }} align="start" sideOffset={4}>
                {found.length === 0 ? <p className="px-4 py-3 text-center text-xs text-muted-foreground">{t("tailoring.customer.noResults")}</p> : (
                  <div className="max-h-64 overflow-y-auto">
                    {found.map((c) => (
                      <button key={c.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { s.setCustomer(c); setFinding(false); setTerm("") }} className="flex w-full cursor-pointer text-start items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted">
                        <UserRound className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                        <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{s.customer.name.slice(0, 2)}</div>
              <span className="flex-1 truncate text-xs font-bold text-primary">{s.customer.name}</span>
              {s.customer.phone && <span dir="ltr" className="flex items-center gap-1 text-[10px] text-primary/70 tabular-nums"><Phone size={10} />{s.customer.phone}</span>}
              <button type="button" aria-label={t("tailoring.customer.change")} onClick={() => s.setCustomer(null)} className="text-base leading-none text-primary/60 hover:text-primary">×</button>
            </div>
          )}
          <Button type="button" size="icon-sm" variant="outline" title={t("tailoring.measures.title")} aria-label={t("tailoring.measures.title")} onClick={() => setMeasuring(true)}
            className={cn("relative border-primary text-primary hover:bg-primary/10 hover:text-primary", filled > 0 && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}><Ruler size={14} /></Button>
          <Button type="button" size="icon-sm" variant="outline" title={t("tailoring.customer.add")} aria-label={t("tailoring.customer.add")} onClick={() => setAdding(true)} className="border-primary text-primary hover:bg-primary/10 hover:text-primary"><Plus size={14} /></Button>
        </div>
        {s.customer && (
          <button type="button" onClick={() => setMeasuring(true)} className={cn("mt-1.5 flex w-full items-center gap-1 text-[10px] font-semibold", filled ? "text-primary" : "text-warning")}>
            <Ruler size={10} />{filled ? t("tailoring.customer.measuresSaved", { n: filled, total: MEASURE_KEYS.length }) : t("tailoring.customer.noMeasures")}
          </button>
        )}
      </div>

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
            <div className={`${CART_GRID} border-b border-border py-1.5 text-[10px] font-semibold text-gray-400 uppercase`}>
              <span>#</span><span>{t("pos1.item")}</span><span className="text-center">{t("pos1.quantity")}</span><span className="flex items-center justify-center text-center">{t("pos1.price")}</span><span className="text-center">{t("pos1.total")}</span><span className="text-center">{t("pos1.actions")}</span>
            </div>
            <ul>
              {s.pieces.map((p) => (
                <li key={p.key} role="button" tabIndex={0} onClick={() => setEditing(p.key)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(p.key) } }}
                  className={cn(CART_GRID, "cursor-pointer items-center border-b border-border py-2 text-start outline-none transition-colors odd:bg-card even:bg-muted/40 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset")}>
                  <span className="text-xs font-medium text-faint tabular-nums">{++row}</span>
                  <div className="min-w-0">
                    <div className="text-xs leading-snug font-bold">{nameOf(p.productId)}</div>
                    {p.fabric || p.color
                      ? <div className="truncate text-[10px] text-gray-400">{[p.fabric, p.color].filter(Boolean).join(" · ")}</div>
                      : <div className="text-[10px] font-semibold text-primary">+ {t("tailoring.addFabric")}</div>}
                    <div className="text-[10px] text-gray-400">{t(`tailoring.style.options.${p.style.collar}`)} · {t(`tailoring.style.options.${p.style.cuff}`)}{p.note && ` · ${p.note}`}</div>
                  </div>
                  <Qty value={p.quantity} onChange={(q) => s.updatePiece(p.key, { quantity: q })} />
                  <span className="text-center text-xs font-semibold text-gray-700 tabular-nums dark:text-foreground">{formatMoney(priceOf(p.productId))}</span>
                  <span className="text-center text-xs font-bold tabular-nums">{formatMoney(piecePrice(p))}</span>
                  <Remove onClick={() => s.removePiece(p.key)} />
                </li>
              ))}
              {s.lines.map((l) => (
                <li key={l.key} className={cn(CART_GRID, "items-center border-b border-border py-2 text-start odd:bg-card even:bg-muted/40")}>
                  <span className="text-xs font-medium text-faint tabular-nums">{++row}</span>
                  <div className="min-w-0 text-xs leading-snug font-bold">{nameOf(l.productId)}</div>
                  <Qty value={l.quantity} onChange={(q) => s.setLineQty(l.key, q)} />
                  <span className="text-center text-xs font-semibold text-gray-700 tabular-nums dark:text-foreground">{formatMoney(priceOf(l.productId))}</span>
                  <span className="text-center text-xs font-bold tabular-nums">{formatMoney(linePrice(l))}</span>
                  <Remove onClick={() => s.removeLine(l.key)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border">
        <div className="flex items-center border-b border-border px-3">
          {TABS.map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={cn("border-b-2 px-1.5 py-2 text-xs whitespace-nowrap transition-colors duration-150", tab === k ? "border-primary font-bold text-primary" : "border-transparent text-gray-400 hover:text-gray-600")}>
              {t(`pos1.${k}`)}
            </button>
          ))}
        </div>

        {tab === "add" && (
          <div className="px-3 pt-2.5 pb-3">
            <div className="mb-1.5 flex justify-between text-xs text-gray-500">
              <span>{t("pos1.subtotal")}</span><span className="text-sm font-semibold text-foreground tabular-nums">{formatMoney(totals.subtotal)}</span>
            </div>
            <div className="mb-1.5 flex justify-between text-xs text-gray-500">
              <span>{t("pos1.tax")}</span><span className="text-sm font-semibold text-foreground tabular-nums">{formatMoney(totals.tax)}</span>
            </div>
            <div className="mt-2 mb-3 flex justify-between border-t border-border pt-1 text-sm font-black text-foreground">
              <span>{t("pos1.payable")}</span><span className="text-xl tabular-nums">{formatMoney(totals.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={empty} onClick={() => s.clear()} className="h-12 w-full gap-2 border-destructive/30 px-5 text-base text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 size={16} />{t("pos1.emptyInvoice")}
              </Button>
              <Button type="button" onClick={pay} className="h-12 w-full gap-2 px-5 text-base">{t("pos1.pay")} <CircleArrowRight /></Button>
            </div>
          </div>
        )}

        {tab === "note" && (
          <div className="p-3">
            <textarea value={s.note} onChange={(e) => s.set({ note: e.target.value })} rows={2} placeholder={t("pos1.addOrderNote")} className="mb-2 w-full resize-none rounded-lg border border-gray-200 bg-background px-2.5 py-2 text-xs outline-none focus:border-primary/40 dark:border-border" />
            <div className="flex gap-2">
              <Button type="button" variant="destructive" className="h-12 flex-1 gap-2 px-5 text-base" onClick={() => s.set({ note: "" })}>{t("common.clear")}</Button>
              <Button type="button" className="h-12 flex-1 gap-2 px-5 text-base" onClick={() => setTab("add")}>{t("common.save")}</Button>
            </div>
          </div>
        )}
      </div>

      <NewCustomerDialog open={adding} onOpenChange={setAdding} />
      <MeasurementsDialog open={measuring} onOpenChange={setMeasuring} />
      <PieceEditor pieceKey={editing} onClose={() => setEditing(null)} />
      <PayDialog open={paying} onOpenChange={setPaying} onConfirm={confirm} />
    </section>
  )
}
