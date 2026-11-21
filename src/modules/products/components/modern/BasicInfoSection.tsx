import type { ReactNode } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { useUnits } from "@/modules/units/queries"
import { useCategories } from "@/modules/categories/queries"
import { kindRules, type ProductForm } from "../../schema"

const randomBarcode = () => String(6221100000000 + Math.floor(Math.random() * 99999))

export function BasicInfoSection({ branchField }: { branchField?: ReactNode }) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "productType" })
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const rules = kindRules(type)

  const category = (
    <FormSelect control={control} name="categoryId" numeric label={t("products.category")} required placeholder={t("products.pickCategory")}
      options={categories.map((c) => ({ value: String(c.id), label: c.parentCategoryId ? `— ${c.categoryNameAr}` : c.categoryNameAr }))} />
  )

  return (
    <SectionCard title={t("products.sections.basic")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {branchField}
        <div className="grid gap-4 sm:col-span-2 lg:grid-cols-3">
          <FormInput control={control} name="productNameAr" label={t("products.nameAr")} required />
          <FormInput control={control} name="productNameEn" label={t("products.nameEn")} dir="ltr" />
          <FormInput control={control} name="productNameUr" label={t("products.nameUr")} dir="ltr" />
        </div>
        {rules.ownBarcodeAndPrice ? (
          <div className={"grid gap-4 sm:col-span-2 lg:grid-cols-3"}>
            <FormInput control={control} name="barcode" label={t("products.barcode")} dir="ltr" required
              end={<Button type="button" size="icon-lg" className="shrink-0 border-success/30 bg-success-soft text-success hover:bg-success/20 hover:text-success" aria-label={t("products.generate")} title={t("products.generate")} onClick={() => setValue("barcode", randomBarcode(), { shouldValidate: true })}><Barcode size={16} /></Button>} />
            {category}
            {rules.unitInBasic && (
              <FormSelect control={control} name="baseUnitId" numeric required label={t("products.baseUnit")}
                options={units.map((u) => ({ value: String(u.id), label: u.name }))} />
            )}
            <div className={rules.unitInBasic ? "lg:col-span-3" : undefined}>
              <FormInput control={control} name="description" label={t("common.description")} placeholder={t("common.optional")} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            {category}
            <FormInput control={control} name="description" label={t("common.description")} placeholder={t("common.optional")} />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
