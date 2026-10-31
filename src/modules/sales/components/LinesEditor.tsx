import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput } from "@/components/form/FormFields"
import { formatMoney } from "@/lib/format"
import { useAppSettings } from "@/modules/settings"
import { lineAmounts } from "../totals"
import type { InvoiceLine } from "../types"
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
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const shown = SPEC.filter((c) => !(hideDiscount && c.id === "discount") && !(simple && (c.id === "discount" || c.id === "taxType")) && !(exempt && (c.id === "taxType" || c.id === "before" || c.id === "vat")))
  const has = (id: ColumnId) => shown.some((c) => c.id === id)
  const template = shown.map((c) => (c.width.endsWith("px") ? c.width : `minmax(0,${c.width})`)).join(" ")
  const L: Record<ColumnId, string> = {
    item: t("sales.productCol"), unit: t("products.unit"), price: purchase ? t("purchases.unitCost") : t("sales.unitPrice"), qty: t("products.quantity"), discount: t("sales.discount"),
    taxType: t("sales.taxType"), before: t("sales.beforeTax"), vat: t("sales.vat"), total: t("sales.lineTotal"), remove: "",
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1"><ProductPicker onAdd={add} purchase={purchase} /></div>
        {allowFreeText && <Button type="button" variant="ghost" size="lg" onClick={addService}>{t("sales.addService")}</Button>}
      </div>

      {rows.fields.length === 0 ? (
        // As in the current system: just the header row with an empty space under it (and the reason, if saving was refused).
        <div className="w-full overflow-x-auto pb-4" style={{ "--cols": template } as React.CSSProperties}>
          <div className="hidden gap-4 border-b border-zinc-200 px-2 pb-3 text-xs font-medium tracking-wide text-zinc-400 uppercase md:grid md:[grid-template-columns:var(--cols)]">
            {shown.map((c, i) => <div key={c.id} className={i === 0 ? "" : "text-center"}>{L[c.id]}</div>)}
          </div>
          <div className="h-16">{rootError && <p className="pt-4 text-center text-sm text-destructive">{t(rootError)}</p>}</div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-4" style={{ "--cols": template } as React.CSSProperties}>
          <div className="hidden gap-4 border-b border-zinc-200 px-2 pb-3 text-xs font-medium tracking-wide text-zinc-400 uppercase md:grid md:[grid-template-columns:var(--cols)]">
            {shown.map((c, i) => <div key={c.id} className={i === 0 ? "" : "text-center"}>{L[c.id]}</div>)}
          </div>
          <div className="mt-3 space-y-3">
            {rows.fields.map((f, i) => {
              const l = lines[i] ?? f
              const a = lineAmounts(l)
              return (
                <div key={f.id} className="grid grid-cols-1 items-center gap-3 rounded-xl border bg-muted/40 p-4 md:rounded-none md:border-none md:bg-transparent md:p-2 md:[grid-template-columns:var(--cols)]">
                  <div className="min-w-0">
                    {l.productId === 0 ? (
                      <FormInput control={control} name={`lines.${i}.name`} label={t("sales.serviceName")} labelHidden placeholder={t("sales.serviceName")} />
                    ) : (
                      <div className="font-semibold text-foreground">{l.name}</div>
                    )}
                  </div>
                  <div className="text-center"><Caption>{L.unit}</Caption><span className="text-sm text-muted-foreground">{l.unitName}</span></div>
                  <div><Caption>{L.price}</Caption><FormInput control={control} name={`lines.${i}.unitPrice`} type="number" label={t("sales.unitPrice")} labelHidden /></div>
                  <div><Caption>{L.qty}</Caption><FormInput control={control} name={`lines.${i}.quantity`} type="number" label={t("products.quantity")} labelHidden /></div>
                  {has("discount") && (
                    <div>
                      <Caption>{L.discount}</Caption>
                      <div className="flex gap-1">
                        <FormInput control={control} name={`lines.${i}.discount`} type="number" label={t("sales.discount")} labelHidden />
                        <Controller control={control} name={`lines.${i}.discountKind`} render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-10 w-16 shrink-0" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                          </Select>
                        )} />
                      </div>
                    </div>
                  )}
                  {has("taxType") && <div className="text-center font-medium text-foreground tabular-nums"><Caption>{L.taxType}</Caption>{l.taxRate}% {l.taxCalculation === 1 ? t("sales.inclusive") : t("sales.exclusive")}</div>}
                  {has("before") && <div className="text-center font-medium text-foreground tabular-nums"><Caption>{L.before}</Caption>{formatMoney(a.net)}</div>}
                  {has("vat") && <div className="text-center font-medium text-orange-500 tabular-nums"><Caption>{L.vat}</Caption>{formatMoney(a.tax)}</div>}
                  <div className="text-center font-bold text-green-500 tabular-nums"><Caption>{L.total}</Caption>{formatMoney(a.total)}</div>
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
