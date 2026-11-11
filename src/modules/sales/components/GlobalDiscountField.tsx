import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormInput } from "@/components/form/FormFields"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** One compact row for the invoice/quote discount: label, amount, then amount-or-percent. Lives inside a FormProvider; needs `globalDiscount` and `globalDiscountKind` in the form. */
export function GlobalDiscountField() {
  const { control } = useFormContext()
  const { t } = useTranslation()
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{t("sales.invoiceDiscount")}</span>
      <FormInput control={control} name="globalDiscount" type="number" label={t("sales.invoiceDiscount")} labelHidden className="w-24" inputClassName="h-9 text-center" />
      <Controller control={control} name="globalDiscountKind" render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger className="h-9 w-20" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">{t("sales.kindPercent")}</SelectItem></SelectContent>
        </Select>
      )} />
    </div>
  )
}
