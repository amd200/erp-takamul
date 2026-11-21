import { Controller, useWatch, type Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { FormInput } from "@/components/form/FormFields"
import type { partyShape } from "../schema"
import type { z } from "zod"

type PartyForm = z.infer<z.ZodObject<typeof partyShape>>

/**
 * The address row and the national-address box, shared by the customer and supplier pop-ups so both look and validate the same.
 * `control` comes from a form whose fields include the shared party fields (`partyShape`).
 */
export function PartyAddressFields({ control }: { control: unknown }) {
  const { t } = useTranslation()
  const c = control as Control<PartyForm>
  const national = useWatch({ control: c, name: "isNational" })
  return (
    <>
      <div className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-[60px_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
        <FormInput control={c} name="countryName" label={t("custDialog.country")} disabled inputClassName="text-center px-1" />
        <FormInput control={c} name="stateName" label={t("custDialog.region")} />
        <FormInput control={c} name="cityName" label={t("custDialog.city")} />
        <FormInput control={c} name="district" label={t("custDialog.district")} />
        <FormInput control={c} name="street" label={t("custDialog.street")} />
      </div>

      <div className="rounded-lg border border-border p-4 col-span-full">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-foreground">{t("custDialog.nationalAddress")}</h3>
          <Controller control={c} name="isNational" render={({ field }) => <Switch className="shrink-0 cursor-pointer" checked={field.value} onCheckedChange={field.onChange} />} />
        </div>
        {national && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <FormInput control={c} name="taxNumber" required label={t("custDialog.taxNumber")} dir="ltr" />
            <FormInput control={c} name="commercialRegister" required label={t("custDialog.commercialRegister")} dir="ltr" />
            <FormInput control={c} name="additionalNumber" required label={t("custDialog.additionalNumber")} />
            <FormInput control={c} name="buildingNumber" required label={t("custDialog.buildingNumber")} />
            <FormInput control={c} name="postalCode" required label={t("custDialog.postalCode")} />
          </div>
        )}
      </div>
    </>
  )
}
