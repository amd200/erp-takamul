import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormInput } from "@/components/form/FormFields"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** One compact row for the invoice/quote discount: label, amount, then amount-or-percent. Lives inside a FormProvider; needs `globalDiscount` and `globalDiscountKind` in the form. */
export function GlobalDiscountField() {
  const { control } = useFormContext()
  const { t } = useTranslation()
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-sm font-medium text-foreground sm:min-w-0 sm:flex-1 sm:truncate">{t("sales.invoiceDiscount")}</span>
      <div className="flex items-center gap-2">
        <FormInput control={control} name="globalDiscount" type="number" label={t("sales.invoiceDiscount")} labelHidden className="min-w-0 flex-1 sm:w-24 sm:flex-none" inputClassName="h-9 text-center" />
        <Controller control={control} name="globalDiscountKind" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-9 w-28 sm:w-20" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">{t("sales.kindPercent")}</SelectItem></SelectContent>
          </Select>
        )} />
      </div>
    </div>
  )
}
