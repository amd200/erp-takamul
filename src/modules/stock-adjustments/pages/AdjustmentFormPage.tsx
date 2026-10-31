import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormTextarea } from "@/components/form/FormFields"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ProductSearchInput } from "@/modules/products/components/ProductSearchInput"
import type { Product } from "@/modules/products/types"
import { useUnits } from "@/modules/units/queries"
import { adjustmentSchema, type AdjustmentForm } from "../schema"
import { useAdjustments, useCreateAdjustment } from "../queries"

const cols = "md:grid-cols-8"
const box = "rounded-sm border border-gray-200 p-6 dark:border-gray-800"
const cap = "mb-1.5 text-xs text-zinc-500 md:hidden"

/**
 * Add a quantity adjustment, or (at /view/:id) look at a saved one: the same form with every field locked.
 * Laid out as in the current system: basic data, the items list with its eight columns, then the buttons.
 */
export default function AdjustmentFormPage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const viewId = id ? Number(id) : undefined
  const isView = !!viewId
  const create = useCreateAdjustment()
  const { data: saved = [] } = useAdjustments()
  const adjustment = isView ? saved.find((a) => a.id === viewId) : undefined
  const { data: units = [] } = useUnits()
  const form = useForm<AdjustmentForm>({ resolver: zodResolver(adjustmentSchema), defaultValues: { notes: "", lines: [] } })
  const lines = useFieldArray({ control: form.control, name: "lines" })
  const values = useWatch({ control: form.control, name: "lines" })
  // The items picked so far; they come from the server search, so only these are ever loaded.
  const [picked, setPicked] = useState<Map<number, Product>>(new Map())

  // Only items that keep a stock balance can be adjusted, and each once.
  const available = (p: Product) => p.balance != null && !values.some((l) => l.productId === p.id)
  const add = (p: Product) => {
    setPicked((all) => new Map(all).set(p.id, p))
    lines.append({ productId: p.id, operation: "Add", quantity: 1 })
  }
  const linesError = form.formState.errors.lines?.message ?? form.formState.errors.lines?.root?.message
  const unitOf = (p?: Product) => units.find((u) => u.id === p?.baseUnitId)?.name ?? ""
  const submit = form.handleSubmit((data) => create.mutate(data, { onSuccess: () => nav("/products/quantity-adjustments") }))

  // One row per line, the same for a new adjustment and a saved one.
  const rows = isView
    ? (adjustment?.items ?? []).map((l) => ({ key: l.productId ?? 0, name: l.productName ?? "", barcode: l.barcode ?? "", unit: l.unitName ?? "", before: l.quantityBefore ?? 0, operation: l.operationType ?? "Add", quantity: l.quantityChanged ?? 0 }))
    : lines.fields.map((f, i) => {
        const product = picked.get(values[i]?.productId)
        return { key: f.id, name: product?.productNameAr ?? "", barcode: product?.barcode ?? "", unit: unitOf(product), before: product?.balance ?? 0, operation: values[i]?.operation ?? "Add", quantity: values[i]?.quantity || 0 }
      })

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl leading-snug font-bold">{t("adjForm.add")}</h1>
        <Button asChild variant="outline"><Link to="/products/quantity-adjustments">{t("adjForm.back")}<ArrowLeft size={16} /></Link></Button>
      </div>

      <form onSubmit={submit} noValidate className="space-y-6">
        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-gray-800">{t("adjForm.basic")}</h2>
          <div className="space-y-6">
            <Field>
              <FieldLabel>{t("adjForm.date")}</FieldLabel>
              <Input readOnly className="cursor-not-allowed text-center" value={adjustment ? formatDateTime(adjustment.operationDate ?? "", i18n.language) : new Date().toLocaleString("en-GB").replace(",", "")} />
            </Field>
            {isView
              ? <Field><FieldLabel>{t("adjForm.notes")}</FieldLabel><Input readOnly value={adjustment?.notes ?? ""} /></Field>
              : <FormTextarea control={form.control} name="notes" label={t("adjForm.notes")} placeholder={t("adjForm.notesHint")} />}
          </div>
        </div>

        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-zinc-900">{t("adjForm.itemsList")}</h2>
          {!isView && (
            <div className="mb-6">
              <FieldLabel className="mb-2 text-sm font-semibold">{t("adjForm.chooseProduct")}</FieldLabel>
              <ProductSearchInput accept={available} onPick={add} placeholder={t("adjForm.chooseProduct")} />
            </div>
          )}

          <div className={cn("hidden items-center gap-4 border-b border-zinc-200 px-2 pb-3 text-xs font-medium tracking-widest text-zinc-400 uppercase md:grid", cols)}>
            <div>{t("adjForm.productName")}</div><div>{t("adjForm.productCode")}</div><div>{t("adjForm.unit")}</div><div>{t("adjForm.before")}</div>
            <div>{t("adjForm.operationType")}</div><div>{t("adjForm.operationQty")}</div><div>{t("adjForm.after")}</div><div />
          </div>

          <div className="mt-3 space-y-3">
            {rows.map((r, i) => {
              const after = r.before + (r.operation === "Add" ? 1 : -1) * r.quantity
              return (
                <div key={r.key} className={cn("grid grid-cols-1 items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 md:rounded-none md:border-none md:bg-transparent md:p-2 mb-8", cols)}>
                  <div><div className={cap}>{t("adjForm.productName")}</div><div className="px-2 py-2.5 text-sm font-medium">{r.name}</div></div>
                  <div><div className={cap}>{t("adjForm.productCode")}</div><Input readOnly value={r.barcode} className="cursor-not-allowed text-center" /></div>
                  <div><div className={cap}>{t("adjForm.unit")}</div><Input readOnly value={r.unit} className="cursor-not-allowed text-center" /></div>
                  <div><div className={cap}>{t("adjForm.before")}</div><Input readOnly value={r.before} className="cursor-not-allowed text-center" /></div>
                  <div>
                    <div className={cap}>{t("adjForm.operationType")}</div>
                    {isView ? (
                      <Select value={r.operation} disabled><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Add">{t("adjForm.opAdd")}</SelectItem><SelectItem value="Remove">{t("adjForm.opRemove")}</SelectItem></SelectContent></Select>
                    ) : (
                      <Controller control={form.control} name={`lines.${i}.operation`} render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full"><SelectValue placeholder={t("adjForm.chooseOperation")} /></SelectTrigger>
                          <SelectContent><SelectItem value="Add">{t("adjForm.opAdd")}</SelectItem><SelectItem value="Remove">{t("adjForm.opRemove")}</SelectItem></SelectContent>
                        </Select>
                      )} />
                    )}
                  </div>
                  <div>
                    <div className={cap}>{t("adjForm.operationQty")}</div>
                    {isView ? <Input readOnly value={r.quantity} className="cursor-not-allowed bg-gray-50 text-center" /> : (
                      <Controller control={form.control} name={`lines.${i}.quantity`} render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Input type="number" min={0.000001} step="any" className="text-center" value={field.value === 0 ? "" : field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                          {fieldState.error && <p className="text-xs text-destructive">{t(fieldState.error.message ?? "")}</p>}
                        </Field>
                      )} />
                    )}
                  </div>
                  <div><div className={cap}>{t("adjForm.after")}</div><Input readOnly value={after} className={cn("cursor-not-allowed bg-zinc-100 text-center", after < 0 && "text-destructive")} /></div>
                  {!isView && (
                    <div className="flex justify-end md:justify-center">
                      <button type="button" aria-label={t("common.remove")} onClick={() => lines.remove(i)} className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 size={18} strokeWidth={1.5} /></button>
                    </div>
                  )}
                </div>
              )
            })}
            {linesError && rows.length === 0 && <p className="py-2 text-center text-sm text-red-500">{t(linesError)}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-4 rounded-sm border border-gray-200 p-5 sm:flex-row sm:items-center sm:p-6 dark:border-gray-800">
          <Button type="button" variant="destructive" size="xl" onClick={() => nav("/products/quantity-adjustments")}>{t("adjForm.cancelBack")}</Button>
          {isView
            ? null
            : <Button type="submit" size="xl" disabled={create.isPending}>{t("adjForm.add")}</Button>}
        </div>
      </form>
    </div>
  )
}
