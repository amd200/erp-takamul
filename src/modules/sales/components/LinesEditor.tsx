import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput } from "@/components/form/FormFields"
import { formatMoney } from "@/lib/format"
import { useAppSettings } from "@/modules/settings"
import { NumberInput } from "@/modules/pos/grid/NumberInput"
import { costFromTotal } from "@/modules/purchases/screen/lines"
import { cn } from "@/lib/utils"
import { useTaxes } from "@/modules/taxes/service"
import { lineAmounts } from "../totals"
import type { InvoiceLine } from "../types"
import { CategoryDiscountBadge } from "./CategoryDiscountBadge"
import { ProductPicker } from "./ProductPicker"

type LinesForm = { lines: InvoiceLine[] }

/** One grid for the header and every row, as in the current system: name, unit, price, quantity, discount, tax type, before tax, tax, total, remove. */
const SPEC = [
  { id: "item", width: "2fr" }, { id: "unit", width: "0.9fr" }, { id: "price", width: "1fr" }, { id: "qty", width: "0.9fr" },
  { id: "discount", width: "2fr" }, { id: "taxType", width: "1fr" }, { id: "before", width: "1fr" }, { id: "vat", width: "0.9fr" },
  { id: "total", width: "1fr" }, { id: "remove", width: "56px" },
] as const
type ColumnId = (typeof SPEC)[number]["id"]

/** A cell's caption on a phone, where the header row is hidden and each row becomes a card. */
const Caption = ({ children }: { children: string }) => <span className="mb-1 block text-xs text-muted-foreground md:hidden">{children}</span>

/**
 * Editable invoice lines, shared by invoices, quotations and debit notes. Adding an item that is already on
 * the invoice (same item and unit) raises its quantity instead of adding a second row.
 * `simple` leaves out the per-line discount and the tax type (a quotation has neither).
 * `hideDiscount` leaves out only the per-line discount.
 */
export function LinesEditor({ allowFreeText, purchase, simple, hideDiscount }: { allowFreeText?: boolean; purchase?: boolean; simple?: boolean; hideDiscount?: boolean }) {
  const { t } = useTranslation()
  const { control, getValues, setValue } = useFormContext<LinesForm>()
  const { errors } = useFormState({ control, name: "lines" })
  const rows = useFieldArray({ control, name: "lines" })
  const lines = useWatch({ control, name: "lines" })
  const rootError = errors.lines?.message ?? errors.lines?.root?.message

  const add = (line: InvoiceLine) => {
    const i = getValues("lines").findIndex((l) => l.productId === line.productId && l.name === line.name && l.unitName === line.unitName)
    if (i >= 0) setValue(`lines.${i}.quantity`, getValues(`lines.${i}.quantity`) + 1, { shouldValidate: true })
    // Keep focus in the barcode box so the next scan doesn't land in the new row.
    else rows.append(line, { shouldFocus: false })
  }
  const addService = () => rows.append({ productId: 0, unitId: 0, name: "", unitName: t("sales.serviceUnit"), quantity: 1, unitPrice: 0, taxRate: 15, taxCalculation: 2, discountKind: "value", discount: 0 })

  // A tax-exempt branch has no tax to show, so the tax type, the amount before tax and the tax itself are left out.
  const settings = useAppSettings()
  const exempt = settings.taxSetting?.taxSetting === "Exempt"
  // Purchase setting "تغيير سعر الإجمالي": the line total is typed and the unit cost is worked back from it, as in the current system.
  const editTotal = !!purchase && !!settings.purchasesScreenTab?.purchesSetting
  const shown = SPEC.filter((c) => !(hideDiscount && c.id === "discount") && !(simple && (c.id === "discount" || (c.id === "taxType" && !purchase))) && !(exempt && (c.id === "taxType" || c.id === "before" || c.id === "vat")))
  const { data: taxes = [] } = useTaxes()
  // Changing a line's tax keeps its total in total mode (the cost moves), otherwise the cost stays and the total moves.
  const setTax = (i: number, taxId: number) => {
    const rate = taxes.find((x) => x.id === taxId)?.amount ?? 0
    const l = getValues(`lines.${i}`)
    if (editTotal) setValue(`lines.${i}.unitPrice`, costFromTotal(lineAmounts(l).total, l.quantity, rate), { shouldValidate: true })
    setValue(`lines.${i}.taxId`, taxId, { shouldValidate: true })
    setValue(`lines.${i}.taxRate`, rate, { shouldValidate: true })
  }
  const has = (id: ColumnId) => shown.some((c) => c.id === id)
  const template = shown.map((c) => (c.width.endsWith("px") ? c.width : `minmax(0,${c.width})`)).join(" ")
  const L: Record<ColumnId, string> = {
    item: t("sales.productCol"), unit: t("products.unit"), price: purchase ? t("purchases.unitCost") : t("sales.unitPrice"), qty: t("products.quantity"), discount: t("sales.discount"),
    taxType: t("sales.taxType"), before: t("sales.beforeTax"), vat: t("sales.vat"), total: t("sales.lineTotal"), remove: "",
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1"><ProductPicker onAdd={add} purchase={purchase} noCategoryDiscount={simple} /></div>
        {allowFreeText && <Button type="button" variant="ghost" size="lg" onClick={addService}>{t("sales.addService")}</Button>}
      </div>

      {rows.fields.length === 0 ? (
        // As in the current system: just the header row with an empty space under it (and the reason, if saving was refused).
        <div className="w-full overflow-x-auto pb-4" style={{ "--cols": template } as React.CSSProperties}>
          <div className="hidden gap-4 border-b border-border px-2 pb-3 text-xs font-medium tracking-wide text-faint uppercase md:grid md:[grid-template-columns:var(--cols)]">
            {shown.map((c, i) => <div key={c.id} className={i === 0 ? "" : "text-center"}>{L[c.id]}</div>)}
          </div>
          <div className="h-16">{rootError && <p className="pt-4 text-center text-sm text-destructive">{t(rootError)}</p>}</div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-4" style={{ "--cols": template } as React.CSSProperties}>
          <div className="hidden gap-4 border-b border-border px-2 pb-3 text-xs font-medium tracking-wide text-faint uppercase md:grid md:[grid-template-columns:var(--cols)]">
            {shown.map((c, i) => <div key={c.id} className={i === 0 ? "" : "text-center"}>{L[c.id]}</div>)}
          </div>
          <div className="mt-3 space-y-3">
            {rows.fields.map((f, i) => {
              const l = lines[i] ?? f
              const a = lineAmounts(l)
              return (
                <div key={f.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border bg-muted/40 p-4 md:rounded-none md:border-none md:bg-transparent md:p-2 md:[grid-template-columns:var(--cols)] md:[&_[data-slot=field]]:relative md:[&_[data-slot=field-error]]:absolute md:[&_[data-slot=field-error]]:top-full md:[&_[data-slot=field-error]]:start-0 md:[&_[data-slot=field-error]]:text-xs md:[&_[data-slot=field-error]]:whitespace-nowrap">
                  <div className="min-w-0">
                    {l.productId === 0 ? (
                      <FormInput control={control} name={`lines.${i}.name`} label={t("sales.serviceName")} labelHidden placeholder={t("sales.serviceName")} />
                    ) : (
                      <div className="font-semibold text-foreground">{l.name}</div>
                    )}
                    {!has("discount") && <CategoryDiscountBadge line={l} className="mt-1" />}
                  </div>
                  <div className="text-center"><Caption>{L.unit}</Caption><span className="text-sm text-muted-foreground">{l.unitName}</span></div>
                  <div><Caption>{L.price}</Caption>{editTotal
                    ? <NumberInput value={l.unitPrice} decimals={2} label={t("sales.unitPrice")} className="w-full" onChange={(n) => setValue(`lines.${i}.unitPrice`, n, { shouldValidate: true })} />
                    : <FormInput control={control} name={`lines.${i}.unitPrice`} type="number" inputClassName="text-center" label={t("sales.unitPrice")} labelHidden />}</div>
                  <div><Caption>{L.qty}</Caption>{editTotal ? (
                    <NumberInput value={l.quantity} positive label={L.qty} className="w-full" onChange={(n) => {
                      // The line keeps its total and the cost moves.
                      setValue(`lines.${i}.unitPrice`, costFromTotal(a.total, n, l.taxRate), { shouldValidate: true })
                      setValue(`lines.${i}.quantity`, n, { shouldValidate: true })
                    }} />
                  ) : <FormInput control={control} name={`lines.${i}.quantity`} type="number" inputClassName="text-center" label={t("products.quantity")} labelHidden />}</div>
                  {has("discount") && (
                    <div>
                      <Caption>{L.discount}</Caption>
                      {l.categoryDiscount ? (
                        // The server replaces the line discount with the category's, so the field only shows it.
                        <div className="flex flex-col gap-1">
                          <Input readOnly disabled aria-label={t("sales.discount")} value={l.categoryDiscount.value} className="h-10 cursor-not-allowed bg-muted/60" />
                          <CategoryDiscountBadge line={l} className="self-start" />
                        </div>
                      ) : (
                      <div className="flex gap-1">
                        <FormInput control={control} name={`lines.${i}.discount`} type="number" inputClassName="text-center" label={t("sales.discount")} labelHidden />
                        <Controller control={control} name={`lines.${i}.discountKind`} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-10 w-16 shrink-0" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                      )}
                    </div>
                  )}
                  {has("taxType") && (purchase ? (
                    // Buying: the tax is picked per line from the tax list, as in the current system.
                    <div className="text-center"><Caption>{L.taxType}</Caption>
                      <Select value={l.taxId ? String(l.taxId) : ""} onValueChange={(v) => setTax(i, Number(v))}>
                        <SelectTrigger className={cn("h-10 w-full", errors.lines?.[i]?.taxId && "border-destructive")} aria-label={L.taxType} aria-invalid={!!errors.lines?.[i]?.taxId || undefined}><SelectValue placeholder={t("pos3.pickTax")} /></SelectTrigger>
                        <SelectContent>{taxes.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  ) : <div className="text-center font-medium text-foreground tabular-nums"><Caption>{L.taxType}</Caption>{l.taxRate}% {l.taxCalculation === 1 ? t("sales.inclusive") : t("sales.exclusive")}</div>)}
                  {has("before") && <div className="text-center font-medium text-foreground tabular-nums"><Caption>{L.before}</Caption>{formatMoney(a.net)}</div>}
                  {has("vat") && <div className="text-center font-medium text-orange-500 tabular-nums"><Caption>{L.vat}</Caption>{formatMoney(a.tax)}</div>}
                  <div className="text-center font-bold text-success tabular-nums"><Caption>{L.total}</Caption>{editTotal
                    ? <NumberInput value={a.total} decimals={2} label={L.total} className="w-full font-bold text-success" onChange={(n) => setValue(`lines.${i}.unitPrice`, costFromTotal(n, l.quantity, l.taxRate), { shouldValidate: true })} />
                    : formatMoney(a.total)}</div>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" aria-label={t("common.remove")} onClick={() => rows.remove(i)} className="p-2 text-muted-foreground transition-colors hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
