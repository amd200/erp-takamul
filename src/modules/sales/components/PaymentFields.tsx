import type { Control, FieldValues, Path } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { useTreasuries } from "@/modules/lookups/service"

/** Amount and treasury fields for one payment, used in the invoice forms and the payments dialog. The method is not asked: a payment goes in as cash. */
export function PaymentFields<T extends FieldValues>({ control, prefix, compact }: { control: Control<T>; prefix?: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const name = (k: string) => (prefix ? `${prefix}.${k}` : k) as Path<T>
  return (
    <>
      <FormInput control={control} name={name("amount")} type="number" label={t("sales.amount")} labelHidden={compact} required />
      <FormSelect control={control} name={name("treasuryId")} numeric label={t("sales.treasury")} labelHidden={compact} required
        options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
    </>
  )
}
