import { useFieldArray, useFormContext, useFormState } from "react-hook-form"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney } from "@/lib/format"
import { useUnits } from "@/modules/units/queries"
import type { ProductForm } from "../../schema"
import { ProductSearchPicker } from "../ProductSearchPicker"
import { RepeatRows } from "./RepeatRows"

/**
 * Raw materials a prepared item is made of, each in a unit; their cost drives the item's cost.
 * Materials are searched on the server when added; a saved recipe brings its materials' names with it.
 */
export function ComponentsSection({ computedCost }: { computedCost: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { errors } = useFormState({ control, name: "components" })
  const rows = useFieldArray({ control, name: "components" })
  const { data: units = [] } = useUnits()
  const rootError = errors.components?.message ?? errors.components?.root?.message

  return (
    <SectionCard
      title={t("products.sections.components")}
      description={t("products.componentsHint", { cost: formatMoney(computedCost) })}
      action={
        // A new material starts in its own base unit.
        <ProductSearchPicker align="end" type="RawMatrial" price={(p) => p.costPrice ?? 0}
          onPick={(p) => rows.append({ componentProductId: p.id, unitId: p.baseUnitId ?? 0, quantity: 1, componentNameAr: p.productNameAr }, { shouldFocus: false })}>
          <Button type="button" variant="outline"><Plus />{t("products.addRaw")}</Button>
        </ProductSearchPicker>
      }
    >
      <RepeatRows
        count={rows.fields.length}
        onRemove={rows.remove}
        empty={t("products.noComponents")}
        error={rootError ? t(rootError) : undefined}
        cols="grid-cols-[2fr_1.2fr_1fr_auto]"
        headers={[t("products.rawMaterial"), t("products.unit"), t("products.quantityPerItem")]}
        renderRow={(i) => (
          <>
            <span className="flex h-10 items-center font-medium">{rows.fields[i].componentNameAr || `#${rows.fields[i].componentProductId}`}</span>
            <FormSelect control={control} name={`components.${i}.unitId`} numeric label={t("products.unit")} labelHidden
              options={units.map((u) => ({ value: String(u.id), label: u.name }))} />
            <FormInput control={control} name={`components.${i}.quantity`} type="number" label={t("products.quantityPerItem")} labelHidden />
          </>
        )}
      />
    </SectionCard>
  )
}
