import { useState } from "react"
import { Plus, ShoppingBasket, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ItemSearch, type SearchOption } from "@/modules/pos/shared/ItemSearch"
import { NumberInput } from "@/modules/pos/shared/NumberInput"
import { lineAmounts } from "@/modules/sales/totals"
import type { Tax } from "@/modules/taxes/types"
import { costFromTotal, type BuyLine } from "./lines"

type Props = {
  lines: BuyLine[]
  taxes: Tax[]
  exempt: boolean
  /** The line total can be typed and the unit cost is worked back from it. */
  editTotal?: boolean
  /** Lines without a tax are marked once the user tried to pay. */
  showErrors: boolean
  search: SearchOption[]
  onPick: (id: number) => void
  onCode: (code: string) => boolean | Promise<boolean>
  /** Set when the search list comes from the server, which needs to know what is typed. */
  onQuery?: (query: string) => void
  searching?: boolean
  codeOf: (l: BuyLine) => string
  onChange: (key: string, patch: Partial<BuyLine>) => void
  onRemove: (key: string) => void
}

const small = "h-7 text-[11px] font-normal"

/**
 * The purchase as a table, as in the current system: a burgundy header, small type, the first row searches or
 * scans an item, every row after it is a line with its cost, quantity, tax and a note. Narrow screens get one card per line.
 */
export function PurchaseLines({ lines, taxes, exempt, editTotal, showErrors, search, onPick, onCode, onQuery, searching, codeOf, onChange, onRemove }: Props) {
  const { t } = useTranslation()
  const [noteOf, setNoteOf] = useState<string | null>(null)

  const setTax = (l: BuyLine, taxId: number) => {
    const rate = taxes.find((x) => x.id === taxId)?.amount ?? 0
    // In total mode the line keeps its total and the cost moves; otherwise the cost stays and the total moves.
    const unitPrice = editTotal ? costFromTotal(lineAmounts(l).total, l.quantity, rate) : l.unitPrice
    onChange(l.key, { taxId, taxPercentage: rate, unitPrice })
  }
  const setQty = (l: BuyLine, quantity: number) =>
    onChange(l.key, editTotal ? { quantity, unitPrice: costFromTotal(lineAmounts(l).total, quantity, l.taxPercentage) } : { quantity })
  const setTotal = (l: BuyLine, total: number) => onChange(l.key, { unitPrice: costFromTotal(total, l.quantity, l.taxPercentage) })

  const taxCell = (l: BuyLine) => {
    const bad = showErrors && !l.taxId
    return (
      <div className="flex flex-col items-center gap-0.5">
        <Select value={l.taxId ? String(l.taxId) : ""} onValueChange={(v) => setTax(l, Number(v))}>
          <SelectTrigger size="sm" className={cn("mx-auto w-24 justify-center text-[11px] data-[size=sm]:h-7", bad && "border-destructive")} aria-label={t("pos3.taxRate")} aria-invalid={bad || undefined}><SelectValue placeholder={t("pos3.pickTax")} /></SelectTrigger>
          <SelectContent>{taxes.map((x) => <SelectItem key={x.id} value={String(x.id)} className="text-center">{x.name}</SelectItem>)}</SelectContent>
        </Select>
        {bad && <span className="text-[9px] leading-tight font-bold text-destructive">{t("pos3.taxRequired")}</span>}
      </div>
    )
  }
  const totalCell = (l: BuyLine) => {
    const a = lineAmounts(l)
    return editTotal
      ? <NumberInput value={a.total} decimals={2} label={t("pos2.finalTotal")} onChange={(n) => setTotal(l, n)} className={cn(small, "mx-auto w-24")} />
      : <span className="tabular-nums">{formatMoney(exempt ? a.net : a.total)}</span>
  }
  const noteCell = (l: BuyLine) => noteOf === l.key
    ? <Input autoFocus className="h-7 text-[11px]" placeholder={t("pos3.addNote")} value={l.lineNote ?? ""} onChange={(e) => onChange(l.key, { lineNote: e.target.value })} onBlur={() => setNoteOf(null)} />
    : l.lineNote
      ? <button type="button" onClick={() => setNoteOf(l.key)} className="max-w-[100px] cursor-pointer truncate text-[10px] text-muted-foreground hover:text-brand-navy">{l.lineNote}</button>
      : <Button type="button" variant="outline" size="icon-xs" aria-label={t("pos3.addNote")} onClick={() => setNoteOf(l.key)} className="text-faint hover:border-brand-navy hover:bg-brand-navy/5 hover:text-brand-navy"><Plus size={12} /></Button>
  const del = (l: BuyLine) => <button type="button" aria-label={t("common.remove")} onClick={() => onRemove(l.key)} className="mx-auto flex size-8 items-center justify-center rounded bg-muted hover:bg-destructive-soft hover:text-destructive"><Trash2 size={13} /></button>

  const cols = [
    { key: "n", label: "#" },
    { key: "code", label: t("pos2.code") },
    { key: "name", label: t("pos3.product"), w: "w-[300px]" },
    { key: "unit", label: t("pos2.unit") },
    { key: "cost", label: t("pos3.unitCost") },
    { key: "qty", label: t("products.quantity") },
    { key: "net", label: t("pos2.totalBeforeTax") },
    { key: "taxId", label: t("pos3.taxPercent"), hide: exempt },
    { key: "tax", label: t("pos3.vat"), hide: exempt },
    { key: "total", label: t("pos2.finalTotal") },
    { key: "note", label: t("pos3.notesCol") },
    { key: "del", label: "" },
  ].filter((c) => !c.hide)

  const cell = (l: BuyLine, key: string, i: number) => {
    const a = lineAmounts(l)
    switch (key) {
      case "n": return i + 1
      case "code": return <span dir="ltr">{codeOf(l)}</span>
      case "name": return <span className="block truncate">{l.productName}</span>
      case "unit": return l.unitName || "—"
      case "cost": return <NumberInput value={l.unitPrice} decimals={editTotal ? 2 : 4} label={t("pos3.unitCost")} onChange={(n) => onChange(l.key, { unitPrice: n })} className={cn(small, "mx-auto w-20")} />
      case "qty": return <NumberInput value={l.quantity} positive label={t("products.quantity")} onChange={(n) => setQty(l, n)} className={cn(small, "mx-auto w-16")} />
      case "net": return <span className="font-semibold tabular-nums">{formatMoney(a.net)}</span>
      case "taxId": return taxCell(l)
      case "tax": return <span className="text-warning tabular-nums">{formatMoney(a.tax)}</span>
      case "total": return totalCell(l)
      case "note": return <div className="flex h-full items-center justify-center">{noteCell(l)}</div>
      case "del": return del(l)
    }
  }

  const empty = (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <ShoppingBasket className="size-11 text-faint" />
      <div className="font-semibold">{t("pos3.empty")}</div>
      <div className="text-sm text-muted-foreground">{t("pos2.emptyHint")}</div>
    </div>
  )

  return (
    <>
      <div className="relative hidden min-h-64 flex-1 overflow-auto border border-border md:block">
        <table className="w-full min-w-[1400px] border-collapse text-center whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            <tr className="bg-pos-purchase text-[10px] font-bold text-pos-purchase-foreground">{cols.map((c) => <th key={c.key} scope="col" className={cn("px-2 py-2 whitespace-nowrap", c.w)}>{c.label}</th>)}</tr>
          </thead>
          <tbody className="text-[11px]">
            <tr className="border-b border-border text-muted-foreground">
              {cols.map((c) => <td key={c.key} className={cn("px-1 py-1", c.w)}>{c.key === "n" ? lines.length + 1 : c.key === "name" ? <ItemSearch bare placeholder={t("pos3.itemSearch")} options={search} onPick={onPick} onCode={onCode} onQuery={onQuery} searching={searching} /> : c.key === "del" ? null : "--"}</td>)}
            </tr>
            {lines.map((l, i) => (
              <tr key={l.key} className={cn("border-b border-border transition-colors hover:bg-muted/50", i % 2 ? "bg-muted/20" : "bg-transparent")}>
                {cols.map((c) => <td key={c.key} className={cn("px-1 py-1", c.w)}>{cell(l, c.key, i)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {lines.length === 0 && empty}
      </div>

      <section className="flex flex-col gap-3 md:hidden">
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">{t("pos2.addItem")}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">{t("pos.items", { count: lines.length })}</span>
          </div>
          <ItemSearch options={search} onPick={onPick} onCode={onCode} onQuery={onQuery} searching={searching} />
        </div>
        {lines.length === 0 ? <div className="rounded-xl border border-dashed bg-card">{empty}</div> : (
          <div className="flex flex-col gap-3">
            {lines.map((l, i) => {
              const a = lineAmounts(l)
              return (
                <article key={l.key} className="space-y-3 rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{l.productName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground"><span dir="ltr">{codeOf(l)}</span> · {l.unitName || "—"}</p>
                    </div>
                    {del(l)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">{t("pos3.unitCost")}{cell(l, "cost", i)}</div>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">{t("products.quantity")}{cell(l, "qty", i)}</div>
                  </div>
                  {!exempt && <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">{t("pos3.taxRate")}{taxCell(l)}</div>}
                  <label className="block space-y-1.5 text-xs text-muted-foreground">{t("pos3.notesCol")}
                    <Input value={l.lineNote ?? ""} onChange={(e) => onChange(l.key, { lineNote: e.target.value })} placeholder={t("pos3.addNote")} className="h-9" />
                  </label>
                  <dl className={cn("grid gap-2 border-t pt-3 text-center", exempt ? "grid-cols-2" : "grid-cols-3")}>
                    <div><dt className="text-[11px] text-muted-foreground">{t("pos2.totalBeforeTax")}</dt><dd className="font-medium tabular-nums">{formatMoney(a.net)}</dd></div>
                    {!exempt && <div><dt className="text-[11px] text-muted-foreground">{t("pos2.tax")}</dt><dd className="font-medium text-warning tabular-nums">{formatMoney(a.tax)}</dd></div>}
                    <div><dt className="text-[11px] text-muted-foreground">{t("pos2.finalTotal")}</dt><dd className="font-bold text-success">{totalCell(l)}</dd></div>
                  </dl>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
