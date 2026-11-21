import { PageBox } from "@/components/PageBox"
import { useEffect, useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput } from "@/components/form/FormFields"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { adjustmentSchema, type AdjustmentForm } from "../schema"
import { useAdjustments, useCreateAdjustment, useUpdateAdjustment } from "../queries"
import { StockSearchInput } from "../StockSearchInput"
import type { StockRowDto } from "../types"

const cols = "md:grid-cols-8"
const box = "rounded-sm border border-border p-6"
const cap = "mb-1.5 text-xs text-muted-foreground md:hidden"

/**
 * Add a quantity adjustment, or (at /view/:id) look at a saved one: the same form with every field locked.
 * Laid out as in the current system: basic data, the items list with its eight columns, then the buttons.
 */
const nowLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }
const toLocal = (s?: string | null) => { if (!s) return nowLocal(); const d = new Date(s); return Number.isNaN(d.getTime()) ? nowLocal() : new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }

export default function AdjustmentFormPage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const viewId = id ? Number(id) : undefined
  const isEdit = useLocation().pathname.includes("/edit/")
  const isView = !!viewId && !isEdit
  const formBranch = useFormBranch(!viewId)
  const create = useCreateAdjustment()
  const update = useUpdateAdjustment()
  const { data: saved = [] } = useAdjustments()
  const adjustment = viewId ? saved.find((a) => a.id === viewId) : undefined
  const form = useForm<AdjustmentForm>({ resolver: zodResolver(adjustmentSchema), defaultValues: { date: nowLocal(), notes: "", lines: [] } })
  const lines = useFieldArray({ control: form.control, name: "lines" })
  const values = useWatch({ control: form.control, name: "lines" })
  // The stock rows picked so far; they come from the server search, so only these are ever loaded.
  const [picked, setPicked] = useState<Map<number, StockRowDto>>(new Map())

  // Editing starts from the saved adjustment: each saved line is the stock row it changed (the line's id), with the quantity it started from.
  useEffect(() => {
    if (!isEdit || !adjustment) return
    const items = adjustment.items ?? []
    form.reset({ date: toLocal(adjustment.operationDate), notes: adjustment.notes ?? "", lines: items.map((l) => ({ stockInventoryId: l.id ?? 0, unitId: l.unitId ?? null, operationType: l.operationType ?? "Add", quantity: l.quantityChanged ?? 0 })) })
    setPicked(new Map(items.map((l) => [l.id ?? 0, {
      id: l.id ?? 0, productId: l.productId ?? 0, productName: l.productName ?? "", barcode: l.barcode, warehouseId: 0, quantityAvailable: l.quantityBefore ?? 0,
      productUnits: l.unitId ? [{ unitId: l.unitId, unitName: l.unitName, isBaseUnit: true }] : [],
    }])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, adjustment?.id])

  // The items belong to the branch, so the ones picked from the old branch are cleared.
  const changeBranch = async (next: number) => {
    await formBranch.pick(next)
    lines.replace([])
    setPicked(new Map())
  }

  // Each item in a warehouse once.
  const available = (r: StockRowDto) => !values.some((l) => l.stockInventoryId === r.id)
  const add = (r: StockRowDto) => {
    setPicked((all) => new Map(all).set(r.id, r))
    lines.append({ stockInventoryId: r.id, unitId: r.productUnits?.find((u) => u.isBaseUnit)?.unitId ?? null, operationType: "Add", quantity: 1 })
  }
  const linesError = form.formState.errors.lines?.message ?? form.formState.errors.lines?.root?.message
  const done = { onSuccess: () => nav("/products/quantity-adjustments") }
  const submit = form.handleSubmit((data) => isEdit && viewId ? update.mutate({ id: viewId, input: data }, done) : create.mutate(data, done))

  // One row per line, the same for a new adjustment and a saved one.
  const rows = isView
    ? (adjustment?.items ?? []).map((l) => ({ key: l.productId ?? 0, name: l.productName ?? "", barcode: l.barcode ?? "", unit: l.unitName ?? "", before: l.quantityBefore ?? 0, operation: l.operationType ?? "Add", quantity: l.quantityChanged ?? 0 }))
    : lines.fields.map((f, i) => {
        const row = picked.get(values[i]?.stockInventoryId)
        return { key: f.id, name: row ? `${row.productName}${row.warehouseName ? ` - ${row.warehouseName}` : ""}` : "", barcode: row?.barcode ?? "", unit: row?.productUnits?.find((u) => u.isBaseUnit)?.unitName ?? "", before: row?.quantityAvailable ?? 0, operation: values[i]?.operationType ?? "Add", quantity: values[i]?.quantity || 0 }
      })

  return (
    <PageBox title={t(isEdit ? "adjForm.edit" : "adjForm.add")}
      action={<Button asChild variant="outline"><Link to="/products/quantity-adjustments">{t("adjForm.back")}<ArrowLeft size={16} /></Link></Button>}>

      <form onSubmit={submit} noValidate className="space-y-6">
        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("adjForm.basic")}</h2>
          <div className="space-y-6">
            {formBranch.show && <BranchSection value={formBranch.branchId} onChange={changeBranch} />}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {isView
              ? <>
                  <Field><FieldLabel>{t("adjForm.date")}</FieldLabel><Input readOnly className="text-center" value={formatDateTime(adjustment?.operationDate ?? "", i18n.language)} /></Field>
                  <Field><FieldLabel>{t("adjForm.notes")}</FieldLabel><Input readOnly value={adjustment?.notes ?? ""} /></Field>
                </>
              : <>
                  <FormInput control={form.control} name="date" type="date" label={t("adjForm.date")} inputClassName="text-center" />
                  <FormInput control={form.control} name="notes" label={t("adjForm.notes")} placeholder={t("adjForm.notesHint")} />
                </>}
            </div>
          </div>
        </div>

        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("adjForm.itemsList")}</h2>
          {!isView && (
            <div className="mb-6">
              <FieldLabel className="mb-2 text-sm font-semibold">{t("adjForm.chooseProduct")}</FieldLabel>
              <StockSearchInput accept={available} onPick={add} placeholder={t("adjForm.chooseProduct")} />
            </div>
          )}

          <div className={cn("hidden items-center gap-4 border-b border-border px-2 pb-3 text-xs font-medium tracking-widest text-faint uppercase md:grid", cols)}>
            <div>{t("adjForm.productName")}</div><div>{t("adjForm.productCode")}</div><div>{t("adjForm.unit")}</div><div>{t("adjForm.before")}</div>
            <div>{t("adjForm.operationType")}</div><div>{t("adjForm.operationQty")}</div><div>{t("adjForm.after")}</div><div />
          </div>

          <div className="mt-3 space-y-3">
            {rows.map((r, i) => {
              const after = r.before + (r.operation === "Add" ? 1 : -1) * r.quantity
              return (
                <div key={r.key} className={cn("grid grid-cols-1 items-center gap-4 rounded-xl border border-zinc-100 bg-muted/50 p-4 md:rounded-none md:border-none md:bg-transparent md:p-2 mb-8", cols)}>
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
                      <Controller control={form.control} name={`lines.${i}.operationType`} render={({ field }) => (
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
                      <button type="button" aria-label={t("common.remove")} onClick={() => lines.remove(i)} className="rounded-md p-2 text-faint transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 size={18} strokeWidth={1.5} /></button>
                    </div>
                  )}
                </div>
              )
            })}
            {linesError && rows.length === 0 && <p className="py-2 text-center text-sm text-red-500">{t(linesError)}</p>}
          </div>
        </div>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <Button type="button" variant="destructive" size="xl" onClick={() => nav("/products/quantity-adjustments")}>{t("adjForm.cancelBack")}</Button>
          {isView
            ? null
            : <Button type="submit" size="xl" disabled={create.isPending || update.isPending}>{t(isEdit ? "adjForm.edit" : "adjForm.add")}</Button>}
        </div>
      </form>
    </PageBox>
  )
}
