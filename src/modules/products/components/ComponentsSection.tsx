import { useFieldArray, useFormContext, useFormState } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { useUnits } from "@/modules/units/queries"
import type { ProductForm } from "../schema"
import { ProductSearchPicker } from "./ProductSearchPicker"

/**
 * Raw materials a prepared item is made of, as in the current system: a tinted box titled "used raw materials", each
 * row with its material, quantity and unit under their own labels. Their cost drives the item's cost.
 * Materials are searched on the server when added; a saved recipe brings its materials' names with it.
 */
export function ComponentsSection({ computedCost: _cost }: { computedCost: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { errors } = useFormState({ control, name: "components" })
  const rows = useFieldArray({ control, name: "components" })
  const { data: units = [] } = useUnits()
  const rootError = errors.components?.message ?? errors.components?.root?.message

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">{t("productForm.usedRaw")}</h3>
        {/* A new material starts in its own base unit. */}
        <ProductSearchPicker align="end" type="RawMatrial" price={(p) => p.costPrice ?? 0}
          onPick={(p) => rows.append({ productId: p.id, unitId: p.baseUnitId ?? 0, quantity: 1, name: p.productNameAr }, { shouldFocus: false })}>
          <Button type="button" variant="outline" size="sm" className="flex items-center gap-2"><Plus size={16} />{t("productForm.addRaw")}</Button>
        </ProductSearchPicker>
      </div>

      {rows.fields.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">{t("productForm.noRaw")}</div>}

      {rows.fields.map((f, i) => (
        <div key={f.id} className="mb-4 grid grid-cols-1 items-start gap-3 border-b border-border pb-4 last:mb-0 last:border-0 last:pb-0 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Field>
              <FieldLabel>{t("productForm.rawMaterial")} <span className="text-red-500">*</span></FieldLabel>
              <Input readOnly tabIndex={-1} className="h-10 bg-background" value={f.name || `#${f.productId}`} />
            </Field>
          </div>
          <div className="lg:col-span-3">
            <FormInput control={control} name={`components.${i}.quantity`} type="number" required label={t("productForm.quantity")} placeholder="0.00" />
          </div>
          <div className="lg:col-span-3">
            <FormSelect control={control} name={`components.${i}.unitId`} numeric required label={t("productForm.unit")} placeholder={t("productForm.unit")}
              options={units.map((u) => ({ value: String(u.id), label: u.name }))} />
          </div>
          <div className="flex items-center justify-center pt-2 lg:col-span-1 lg:pt-8">
            <Button type="button" variant="destructive" aria-label={t("productForm.deleteRaw")} onClick={() => rows.remove(i)}>
              <Trash2 size={18} /><span className="ms-2 lg:hidden">{t("productForm.deleteRaw")}</span>
            </Button>
          </div>
        </div>
      ))}

      {rootError && <p className="mt-2 text-sm text-red-500">{t(rootError)}</p>}
    </div>
  )
}
