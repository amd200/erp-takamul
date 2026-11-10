import { useEffect } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { useExemptionReasons, useTaxes } from "@/modules/taxes/service"
import { kindRules, type ProductForm } from "../../schema"

export function PricingSection({ computedCost }: { computedCost: number }) {
  const { t } = useTranslation()
  const { control, setValue, getValues } = useFormContext<ProductForm>()
  const [type, taxId] = useWatch({ control, name: ["type", "taxId"] })
  const { data: taxes = [] } = useTaxes()
  const { data: reasons = [] } = useExemptionReasons()
  const rules = kindRules(type)
  const zeroRate = taxes.find((x) => x.id === taxId)?.amount === 0
  const taxReasons = reasons.filter((r) => r.taxId === taxId)

  // A prepared item's cost always follows its components.
  useEffect(() => {
    if (rules.costIsComputed) setValue("costPrice", Math.round(computedCost * 100) / 100)
  }, [rules.costIsComputed, computedCost, setValue])

  // Changing to a tax that has no exemption clears a stale reason.
  useEffect(() => {
    if (!zeroRate && getValues("taxExemptionReasonId") != null) setValue("taxExemptionReasonId", null)
  }, [zeroRate, getValues, setValue])

  return (
    <SectionCard title={rules.sells ? t("products.sections.pricing") : t("products.sections.cost")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput control={control} name="costPrice" type="number" label={t("products.cost")}
          disabled={rules.costIsComputed} description={rules.costIsComputed ? t("products.costComputed") : undefined} />
        {rules.ownBarcodeAndPrice && <FormInput control={control} name="sellingPrice" type="number" label={t("products.sellingPrice")} required />}
        {rules.sells && (
          <>
            <FormSelect control={control} name="taxId" numeric required label={t("products.tax")}
              options={taxes.map((x) => ({ value: String(x.id), label: `${x.name} (${x.amount}%)` }))} />
            <FormSelect control={control} name="taxCalculation" numeric label={t("products.taxCalculation")}
              options={[{ value: "1", label: t("products.taxInclusive") }, { value: "2", label: t("products.taxExclusive") }]} />
            {zeroRate && (
              <FormSelect control={control} name="taxExemptionReasonId" numeric required label={t("products.exemptionReason")}
                placeholder={t("products.pickReason")} className="sm:col-span-2"
                options={taxReasons.map((r) => ({ value: String(r.id), label: r.taxExemptionReasonText || r.taxExemptionReasonCode || "" }))} />
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}
