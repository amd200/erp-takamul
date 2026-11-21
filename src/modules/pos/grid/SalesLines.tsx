import { useState } from "react"
import { enteredPrice } from "@/modules/products/pricing"
import { Handbag, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Product } from "@/modules/products/types"
import { CategoryDiscountBadge } from "@/modules/sales/components/CategoryDiscountBadge"
import { lineAmounts } from "@/modules/sales/totals"
import { usePosStore } from "../store"
import type { CartLine } from "../types"
import { ItemSearch, type SearchOption } from "./ItemSearch"

export type LineOptions = { exempt: boolean; editPrice?: boolean; showCost?: boolean; saleUnits?: boolean }
type UnitChoice = { unitId: number; name: string; price: number }

const money = (n: number) => n.toFixed(2)
const noSpin = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

/** The units an item sells in: its base unit at the item price, then its extra sale units. */
function unitChoices(p: Product | undefined, unitName: (id: number) => string): UnitChoice[] {
  if (!p) return []
  return [{ unitId: p.baseUnitId ?? 0, name: unitName(p.baseUnitId ?? 0), price: enteredPrice(p) }, ...(p.units ?? []).filter((u) => !u.isBaseUnit).map((u) => ({ unitId: u.unitId, name: unitName(u.unitId), price: u.sellingPrice ?? 0 }))]
}

/** The unit price before tax, whichever way the item's price is entered. */
const priceBeforeTax = (l: CartLine) => (l.taxCalculation === 1 ? l.unitPrice / (1 + l.taxPercentage / 100) : l.unitPrice)

type Props = {
  lines: CartLine[]
  options: LineOptions
  search: SearchOption[]
  onPick: (id: number) => void
  onCode: (code: string) => boolean | Promise<boolean>
  /** Set when the search list comes from the server, which needs to know what is typed. */
  onQuery?: (query: string) => void
  searching?: boolean
  product: (id: number) => Product | undefined
  unitName: (id: number) => string
  locked: boolean
}

/** A number box that can be cleared while typing; the line only changes on a valid number. */
function NumberBox({ value, onChange, positive, className, label, disabled }: { value: number; onChange: (n: number) => void; positive?: boolean; className: string; label: string; disabled?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input type="text" inputMode="decimal" dir="ltr" placeholder="0" aria-label={label} disabled={disabled}
      value={draft ?? (value ? String(Number(value.toFixed(4))) : "")}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        const v = e.target.value
        if (!/^\d*\.?\d*$/.test(v)) return
        setDraft(v)
        const n = parseFloat(v)
        if (Number.isFinite(n) && (positive ? n > 0 : n >= 0)) onChange(n)
      }}
      className={cn(noSpin, className)} />
  )
}

function Qty({ line, locked, wide }: { line: CartLine; locked: boolean; wide?: boolean }) {
  const { t } = useTranslation()
  const patch = usePosStore((s) => s.patchLine)
  const set = (n: number) => !locked && patch(line.key, { quantity: n })
  return wide ? (
    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[#dfe7f1] bg-background dark:border-border" dir="ltr">
      <button type="button" aria-label={t("pos.less")} onClick={() => set(Math.max(1, Math.ceil(line.quantity) - 1))} className="flex h-full w-10 items-center justify-center text-base font-bold hover:bg-muted">−</button>
      <NumberBox value={line.quantity} positive onChange={set} label={t("pos2.qty")} disabled={locked} className="h-full min-w-0 flex-1 border-x border-[#edf1f6] bg-transparent text-center text-xs font-black outline-none dark:border-border" />
      <button type="button" aria-label={t("pos.more")} onClick={() => set(Math.floor(line.quantity) + 1)} className="flex h-full w-10 items-center justify-center text-base font-bold hover:bg-muted">+</button>
    </div>
  ) : (
    <div className="mx-auto flex h-6.75 w-[84px] items-center justify-center overflow-hidden rounded-[6px] border border-[#dfe7f1] bg-white dark:border-border dark:bg-background">
      <button type="button" aria-label={t("pos.less")} onClick={() => set(Math.max(1, Math.ceil(line.quantity) - 1))} className="flex h-full w-6 items-center justify-center text-[12px]/[1.5] font-semibold transition-colors hover:bg-muted">−</button>
      <NumberBox value={line.quantity} positive onChange={set} label={t("pos2.qty")} disabled={locked} className="h-full w-9 border-x border-[#edf1f6] bg-transparent text-center text-[13px] font-bold outline-none dark:border-border" />
      <button type="button" aria-label={t("pos.more")} onClick={() => set(Math.floor(line.quantity) + 1)} className="flex h-full w-6 items-center justify-center text-[12px]/[1.5] font-semibold transition-colors hover:bg-muted">+</button>
    </div>
  )
}

function UnitCell({ line, choices, enabled, locked, className }: { line: CartLine; choices: UnitChoice[]; enabled: boolean; locked: boolean; className: string }) {
  const { t } = useTranslation()
  const patch = usePosStore((s) => s.patchLine)
  return (
    <Select value={String(line.unitId)} disabled={locked || !enabled} onValueChange={(v) => {
      const u = choices.find((c) => c.unitId === Number(v))
      if (u) patch(line.key, { unitId: u.unitId, unitName: u.name, unitPrice: u.price })
    }}>
      <SelectTrigger className={className} aria-label={t("pos2.selectUnit")}><SelectValue placeholder={t("pos2.selectUnit")} /></SelectTrigger>
      <SelectContent>{choices.map((u) => <SelectItem key={u.unitId} value={String(u.unitId)}>{u.name}</SelectItem>)}</SelectContent>
    </Select>
  )
}

/**
 * The sale as a table, laid out as in the current second sales screen: the first row searches or scans an
 * item, every row after it is a line. Below the wide breakpoint each line is a card.
 */
export function SalesLines({ lines, options: o, search, onPick, onCode, onQuery, searching, product, unitName, locked }: Props) {
  const { t } = useTranslation()
  const patch = usePosStore((s) => s.patchLine)
  const remove = usePosStore((s) => s.remove)
  const [noteKey, setNoteKey] = useState<string | null>(null)

  const columns = [
    { key: "index", width: 33 },
    { key: "code", width: 84 },
    { key: "name", width: 172.5 },
    { key: "unit", width: 96 },
    { key: "price", visible: !(o.exempt && o.editPrice), width: 118.5 },
    { key: "editablePrice", visible: !!o.editPrice, width: 87 },
    { key: "costPrice", visible: !!o.showCost, width: 82.5 },
    { key: "qty", width: 103.5 },
    { key: "totalBeforeTax", visible: !o.exempt, width: 118.5 },
    { key: "totalTax", visible: !o.exempt, width: 87 },
    { key: "finalTotal", width: 96 },
    { key: "notes", width: 54 },
    { key: "actions", width: 42 },
  ].filter((c) => c.visible !== false)

  const codeOf = (l: CartLine) => {
    const p = product(l.productId)
    return (p?.units ?? []).find((u) => u.unitId === l.unitId)?.barcode || p?.barcode || String(l.productId)
  }
  const setPrice = (l: CartLine, n: number) => patch(l.key, { unitPrice: Math.round(n * 100) / 100 })
  const units = (l: CartLine) => unitChoices(product(l.productId), unitName)
  const canSwitch = (l: CartLine) => o.saleUnits && units(l).length > 1

  const emptyMessage = (
    <>
      <h3 className="text-sm font-bold text-foreground/80">{t("pos2.cartEmpty")}</h3>
      <p className="text-[11px] text-muted-foreground">{t("pos2.startAdding")}</p>
    </>
  )

  return (
    <>
      <section className="mt-1 flex flex-col gap-3 xl:hidden">
        <div className="rounded-xl border border-[#dfe7f1] border-t-2 border-t-[#1db56c] bg-card p-3 shadow-[0_6px_18px_rgba(15,46,87,0.07)] dark:border-border">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-[#17375f] dark:text-foreground">{t("pos2.chooseProduct")}</span>
            <span className="rounded-full bg-[#eef5fb] px-2.5 py-1 text-[10px] font-bold text-[#496683] dark:bg-muted">{lines.length} {t("pos2.items")}</span>
          </div>
          <ItemSearch className="rounded-lg border border-[#dfe7f1] bg-background dark:border-border" options={search} onPick={onPick} onCode={onCode} onQuery={onQuery} searching={searching} placeholder={t("pos2.searchPlaceholder")} posStyle />
        </div>

        {lines.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfdbe7] bg-card px-4 py-8 text-center dark:border-border">
            <Handbag size={38} className="text-muted-foreground/70" />
            {emptyMessage}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lines.map((l, idx) => {
              const a = lineAmounts(l)
              return (
                <article key={l.key} className="overflow-hidden rounded-xl border border-[#dfe7f1] bg-card shadow-[0_4px_14px_rgba(15,46,87,0.06)] dark:border-border">
                  <header className="flex items-start gap-3 border-b border-[#e7edf3] bg-[#f8fbfe] px-3 py-2.5 dark:border-border dark:bg-muted/20">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#082b66] text-[11px] font-black text-white">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-extrabold text-[#17375f] dark:text-foreground">{l.productName}</h3>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground" dir="ltr">{codeOf(l)}</p>
                      <CategoryDiscountBadge line={l} className="mt-1" />
                    </div>
                    <button type="button" disabled={locked} onClick={() => remove(l.key)} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 dark:bg-red-950/20" aria-label={t("pos2.delete")}>
                      <Trash2 size={15} />
                    </button>
                  </header>

                  <div className="grid grid-cols-2 gap-3 p-3">
                    <div className="min-w-0">
                      <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("pos2.unit")}</span>
                      {canSwitch(l)
                        ? <UnitCell line={l} choices={units(l)} enabled locked={locked} className="h-9 w-full rounded-lg text-xs" />
                        : <div className="flex h-9 items-center justify-center rounded-lg bg-muted/60 px-2 text-xs font-bold text-[#17375f] dark:text-foreground">{l.unitName || "--"}</div>}
                    </div>

                    {!(o.exempt && o.editPrice) && (
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{o.exempt ? t("pos2.unitPrice") : t("pos2.priceBeforeTax")}</span>
                        <div className="flex h-9 items-center justify-center rounded-lg bg-muted/60 px-2 text-xs font-extrabold tabular-nums">{money(o.exempt ? l.unitPrice : priceBeforeTax(l))}</div>
                      </div>
                    )}

                    {o.editPrice && (
                      <div>
                        <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("pos2.unitPrice")}</span>
                        <NumberBox value={l.unitPrice} onChange={(n) => setPrice(l, n)} label={t("pos2.unitPrice")} disabled={locked}
                          className="h-9 w-full rounded-lg border border-[#dfe7f1] bg-background px-2 text-center text-xs font-bold outline-none focus:border-primary dark:border-border" />
                      </div>
                    )}

                    <div className={cn(!o.editPrice && "col-span-2")}>
                      <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("pos2.qty")}</span>
                      <Qty line={l} locked={locked} wide />
                    </div>

                    {o.showCost && (
                      <div className="col-span-2 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-[11px]">
                        <span className="text-muted-foreground">{t("pos2.cost")}</span>
                        <span className="font-bold tabular-nums">{money(product(l.productId)?.costPrice ?? 0)}</span>
                      </div>
                    )}

                    <div className="col-span-2 grid grid-cols-3 gap-2 rounded-xl bg-[#f4f8fc] p-2 dark:bg-muted/30">
                      {!o.exempt && <div className="text-center"><span className="block text-[9px] text-muted-foreground">{t("pos2.totalBeforeTax")}</span><strong className="text-[11px] tabular-nums">{money(a.net)}</strong></div>}
                      {!o.exempt && <div className="text-center"><span className="block text-[9px] text-muted-foreground">{t("pos2.tax")}</span><strong className="text-[11px] tabular-nums">{money(a.tax)}</strong></div>}
                      <div className={cn("text-center", o.exempt && "col-span-3")}><span className="block text-[9px] text-muted-foreground">{t("pos2.finalTotal")}</span><strong className="text-sm text-[#159455] tabular-nums">{money(o.exempt ? a.net : a.total)}</strong></div>
                    </div>

                    <div className="col-span-2">
                      <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("pos2.notes")}</span>
                      <Input value={l.notes} disabled={locked} onChange={(e) => patch(l.key, { notes: e.target.value })} placeholder={t("pos2.typeNote")} className="h-9 text-xs" />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="relative hidden min-h-0 flex-1 flex-col overflow-x-auto rounded-[9px] border border-border border-t-2 border-t-primary bg-card shadow-[0_8px_24px_rgba(15,46,87,0.08)] xl:flex">
        <table className="h-full min-h-full w-full min-w-[1039.5px] table-fixed border-separate border-spacing-0 whitespace-nowrap text-[#17375f] dark:text-foreground">
          <colgroup>{columns.map((c) => <col key={c.key} style={{ width: c.width }} />)}</colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="h-8.25 bg-[#082b66] text-center text-[13px] font-extrabold text-white dark:bg-primary dark:text-primary-foreground [&_th]:px-1.5">
              <th>#</th>
              <th>{t("pos2.productCode")}</th>
              <th className="text-start">{t("pos2.productName")}</th>
              <th>{t("pos2.unit")}</th>
              {!(o.exempt && o.editPrice) && <th>{o.exempt ? t("pos2.unitPrice") : t("pos2.priceBeforeTax")}</th>}
              {o.editPrice && <th>{t("pos2.unitPrice")}</th>}
              {o.showCost && <th>{t("pos2.cost")}</th>}
              <th>{t("pos2.qty")}</th>
              {!o.exempt && <th>{t("pos2.totalBeforeTax")}</th>}
              {!o.exempt && <th>{t("pos2.totalTax")}</th>}
              <th>{t("pos2.finalTotal")}</th>
              <th>{t("pos2.notes")}</th>
              <th><span className="sr-only">{t("common.actions")}</span></th>
            </tr>
          </thead>

          <tbody className="text-center text-[13px] font-medium">
            <tr className="h-10.5 bg-muted/20 text-muted-foreground [&>td]:border-b [&>td]:border-border">
              <td className="px-1.5">{lines.length + 1}</td>
              <td>--</td>
              <td className="px-1.5"><ItemSearch options={search} onPick={onPick} onCode={onCode} onQuery={onQuery} searching={searching} placeholder={t("pos2.searchPlaceholder")} bare posStyle /></td>
              <td>--</td>
              {!(o.exempt && o.editPrice) && <td>--</td>}
              {o.editPrice && <td>--</td>}
              {o.showCost && <td>--</td>}
              <td>--</td>
              {!o.exempt && <td>--</td>}
              {!o.exempt && <td>--</td>}
              <td>--</td>
              <td>-</td>
              <td />
            </tr>

            {lines.map((l, idx) => {
              const a = lineAmounts(l)
              const noting = noteKey === l.key
              return (
                <tr key={l.key} className={cn("h-10.5 transition-colors [&>td]:border-b [&>td]:border-border", idx % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                  <td>{idx + 1}</td>
                  <td dir="ltr">{codeOf(l)}</td>
                  <td className="px-2.25 text-start"><span className="block truncate">{l.productName}</span><CategoryDiscountBadge line={l} className="mt-0.5" /></td>
                  <td className="px-1.5">
                    {canSwitch(l)
                      ? <UnitCell line={l} choices={units(l)} enabled locked={locked} className="mx-auto h-6.75! w-[84px] rounded-[6px] border-[#dfe7f1] bg-white text-[13px] font-semibold text-[#17375f] dark:border-border dark:bg-background dark:text-foreground" />
                      : <span className="inline-flex h-6.75 min-w-[66px] items-center justify-center rounded-[6px] px-2.25 font-semibold text-[#17375f] dark:text-foreground">{l.unitName || "--"}</span>}
                  </td>
                  {!(o.exempt && o.editPrice) && <td className="tabular-nums">{money(o.exempt ? l.unitPrice : priceBeforeTax(l))}</td>}
                  {o.editPrice && (
                    <td>
                      <NumberBox value={l.unitPrice} onChange={(n) => setPrice(l, n)} label={t("pos2.unitPrice")} disabled={locked}
                        className="h-6.75 w-15 rounded-[6px] border border-border bg-card text-center text-[13px] font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </td>
                  )}
                  {o.showCost && <td className="font-medium tabular-nums">{money(product(l.productId)?.costPrice ?? 0)}</td>}
                  <td><Qty line={l} locked={locked} /></td>
                  {!o.exempt && <td className="font-semibold tabular-nums">{money(a.net)}</td>}
                  {!o.exempt && <td className="tabular-nums">{money(a.tax)}</td>}
                  <td className="font-extrabold text-[#159455]">
                    <span className="inline-flex min-w-[69px] items-center justify-center rounded-[6px] bg-[#eaf8f1] px-2.25 py-1.5 tabular-nums dark:bg-emerald-950/30">{money(o.exempt ? a.net : a.total)}</span>
                  </td>
                  <td colSpan={noting ? 2 : 1} className={noting ? "px-1.5" : undefined}>
                    {noting ? (
                      <Input autoFocus className="h-6 w-full text-[13px]" placeholder={t("pos2.typeNote")} value={l.notes} aria-label={t("pos2.notes")}
                        onChange={(e) => patch(l.key, { notes: e.target.value })} onBlur={() => setNoteKey(null)} onKeyDown={(e) => e.key === "Enter" && setNoteKey(null)} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {l.notes ? (
                          <button type="button" disabled={locked} onClick={() => setNoteKey(l.key)} className="max-w-[75px] cursor-pointer truncate text-[12px] text-muted-foreground hover:text-primary">{l.notes}</button>
                        ) : (
                          <Button type="button" variant="outline" size="icon-xs" disabled={locked} aria-label={t("pos2.notes")} onClick={() => setNoteKey(l.key)}
                            className="size-6 rounded-[6px] border border-[#dfe7f1] bg-white text-[#18a65c] transition hover:border-[#18a65c]/40 hover:bg-[#18a65c]/5 hover:text-[#14894c] dark:border-border dark:bg-background">
                            <Plus size={9} />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                  {!noting && (
                    <td>
                      <button type="button" disabled={locked} onClick={() => remove(l.key)} aria-label={t("pos2.delete")} className="mx-auto flex size-6 items-center justify-center rounded-[6px] bg-[#f2f6fa] text-[#17375f] transition-colors hover:bg-red-500/10 hover:text-red-500 dark:bg-muted/50 dark:text-foreground">
                        <Trash2 size={11.25} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}

            {/* Fills the space left under the lines, one cell per column so the column borders carry on. */}
            <tr className="h-full">{columns.map((c) => <td key={c.key} />)}</tr>
          </tbody>
        </table>
        {lines.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-15 bottom-0 z-[1] flex flex-col items-center justify-center gap-2.25 px-3 py-9 text-center select-none">
            <Handbag size={37.5} className="text-muted-foreground" />
            <div className="space-y-0.75">
              <h3 className="text-[10.5px]/[1.4286] font-bold text-foreground/80">{t("pos2.cartEmpty")}</h3>
              <p className="text-[8.25px] text-muted-foreground">{t("pos2.startAdding")}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
