import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { useUnits } from "@/modules/units/queries"
import { kindRules, type ProductForm } from "../../schema"
import { RepeatRows } from "./RepeatRows"

export function StockUnitsSection() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "productType" })
  const { data: units = [] } = useUnits()
  const extra = useFieldArray({ control, name: "units" })
  const rules = kindRules(type)
  const unitOptions = units.map((u) => ({ value: String(u.id), label: u.name }))

  if (rules.unitInBasic) return null

  return (
    <SectionCard title={t("products.sections.units")}>
      <div className={rules.purchaseUnit ? "grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid items-start gap-4 sm:grid-cols-2"}>
        {<FormSelect control={control} name="baseUnitId" numeric required label={t("products.baseUnit")} options={unitOptions} />}
        {rules.purchaseUnit && (
          <>
            <FormSelect control={control} name="purchaseUnitId" numeric required label={t("products.purchaseUnit")} options={unitOptions} />
            <FormInput control={control} name="conversionFactor" type="number" required label={t("products.conversionFactor")} description={t("products.conversionHint")} />
          </>
        )}
        {rules.holdsStock && (
          <FormInput control={control} name="minStockLevel" type="number" label={t("products.minStock")} description={t("products.minStockHint")} />
        )}
      </div>

      {rules.extraUnits && (
        <>
          <Separator className="my-5" />
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-medium">{t("products.extraUnits")}</div>
              <div className="text-xs text-muted-foreground">{t("products.extraUnitsHint")}</div>
            </div>
            <Button type="button" variant="outline" onClick={() => extra.append({ unitId: 4, conversionFactor: 12, barcode: "", sellingPrice: 0 })}>
              <Plus />{t("products.addUnit")}
            </Button>
          </div>
          <RepeatRows
            count={extra.fields.length}
            onRemove={extra.remove}
            empty={t("products.noExtraUnits")}
            cols="grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1fr)_auto]"
            headers={[t("products.unit"), t("products.factor"), t("products.barcode"), t("products.sellingPrice")]}
            renderRow={(i) => (
              <>
                <FormSelect control={control} name={`units.${i}.unitId`} numeric label={t("products.unit")} labelHidden options={unitOptions} />
                <FormInput control={control} name={`units.${i}.conversionFactor`} type="number" label={t("products.factor")} labelHidden />
                <FormInput control={control} name={`units.${i}.barcode`} dir="ltr" label={t("products.barcode")} labelHidden />
                <FormInput control={control} name={`units.${i}.sellingPrice`} type="number" label={t("products.sellingPrice")} labelHidden />
              </>
            )}
          />
        </>
      )}
    </SectionCard>
  )
}
