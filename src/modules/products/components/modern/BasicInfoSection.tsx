import type { ReactNode } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { useCategories } from "@/modules/categories/queries"
import { kindRules, type ProductForm } from "../../schema"

const randomBarcode = () => String(6221100000000 + Math.floor(Math.random() * 99999))

export function BasicInfoSection({ branchField }: { branchField?: ReactNode }) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "type" })
  const { data: categories = [] } = useCategories()
  const rules = kindRules(type)

  return (
    <SectionCard title={t("products.sections.basic")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {branchField}
        <FormInput control={control} name="nameAr" label={t("common.nameAr")} required />
        <FormInput control={control} name="nameEn" label={t("common.nameEn")} dir="ltr" />
        <FormInput control={control} name="nameUr" label={t("common.nameUr")} dir="ltr" className={rules.ownBarcodeAndPrice ? undefined : "sm:col-span-2"} />
        {rules.ownBarcodeAndPrice && (
          <FormInput control={control} name="barcode" label={t("products.barcode")} dir="ltr" required
            end={<Button type="button" variant="outline" onClick={() => setValue("barcode", randomBarcode(), { shouldValidate: true })}>{t("products.generate")}</Button>} />
        )}
        <FormSelect control={control} name="categoryId" numeric label={t("products.category")} required placeholder={t("products.pickCategory")} className="sm:col-span-2"
          options={categories.map((c) => ({ value: String(c.id), label: c.parentCategoryId ? `— ${c.categoryNameAr}` : c.categoryNameAr }))} />
        <FormTextarea control={control} name="description" label={t("common.description")} placeholder={t("common.optional")} className="sm:col-span-2" />
      </div>
    </SectionCard>
  )
}
