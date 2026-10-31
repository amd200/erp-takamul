import { Controller, useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { FormInput, FormSwitch } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import type { PartyBase } from "../types"

type PartyForm = Omit<PartyBase, "id" | "code">

/**
 * Name, contact and tax identity. `extra` adds module-specific fields (e.g. supplier payment terms),
 * `lead` goes above the name, and `basic` keeps only the name and phone.
 */
export function IdentitySection({ extra, lead, email = true, basic = false }: { extra?: React.ReactNode; lead?: React.ReactNode; email?: boolean; basic?: boolean }) {
  const { t } = useTranslation()
  const { control } = useFormContext<PartyForm>()
  const national = useWatch({ control, name: "isNational" })
  return (
    <SectionCard title={t("partners.sections.identity")}>
      <div className="grid gap-4 sm:grid-cols-2">
        {lead && <div className="sm:col-span-2">{lead}</div>}
        <FormInput control={control} name="name" label={t("partners.name")} required />
        <FormInput control={control} name="phone" label={t("users.mobile")} dir="ltr" placeholder="05XXXXXXXX" />
        {email && !basic && <FormInput control={control} name="email" type="email" label={t("users.email")} dir="ltr" />}
        {!basic && <div className="sm:col-span-2"><FormSwitch control={control} name="isNational" label={t("partners.isNational")} description={t("partners.isNationalHint")} /></div>}
        {national && !basic && (
          <>
            <FormInput control={control} name="taxNumber" label={t("partners.taxNumber")} dir="ltr" placeholder="3XXXXXXXXXXXXX3" description={t("partners.taxNumberHint")} />
            <FormInput control={control} name="commercialRegister" label={t("partners.commercialRegister")} dir="ltr" />
          </>
        )}
        {extra}
      </div>
    </SectionCard>
  )
}

/** The Saudi national address, required by ZATCA when the party has a VAT number. */
export function AddressSection() {
  const { t } = useTranslation()
  const { control } = useFormContext<PartyForm>()
  const [national, vat] = useWatch({ control, name: ["isNational", "taxNumber"] })
  const required = national && !!vat
  return (
    <SectionCard title={t("partners.sections.address")} description={required ? t("partners.addressRequired") : t("partners.addressHint")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormInput control={control} name="country" label={t("partners.country")} />
        <FormInput control={control} name="state" label={t("partners.state")} />
        <FormInput control={control} name="city" label={t("partners.city")} required={required} />
        <FormInput control={control} name="district" label={t("partners.district")} required={required} />
        <FormInput control={control} name="street" label={t("partners.street")} required={required} className="sm:col-span-2" />
        <FormInput control={control} name="buildingNumber" label={t("partners.buildingNumber")} dir="ltr" required={required} placeholder="1234" />
        <FormInput control={control} name="additionalNumber" label={t("partners.additionalNumber")} dir="ltr" placeholder="5678" />
        <FormInput control={control} name="postalCode" label={t("partners.postalCode")} dir="ltr" required={required} placeholder="12345" />
      </div>
    </SectionCard>
  )
}

/** Balance carried over from before the system; it starts the account statement. */
export function OpeningBalanceSection({ locked }: { locked?: boolean }) {
  const { t } = useTranslation()
  const { control } = useFormContext<PartyForm>()
  return (
    <SectionCard title={t("partners.sections.opening")} description={locked ? t("partners.openingLocked") : t("partners.openingHint")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormInput control={control} name="openingBalance" type="number" label={t("partners.openingBalance")} disabled={locked} />
        <Controller control={control} name="openingBalanceType" render={({ field }) => (
          <Field>
            <FieldLabel>{t("partners.balanceSide")}</FieldLabel>
            <ToggleGroup type="single" variant="outline" disabled={locked} value={field.value} onValueChange={(v) => v && field.onChange(v)} className="w-full">
              <ToggleGroupItem value="debit" className="h-10 flex-1 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">{t("partners.debit")}</ToggleGroupItem>
              <ToggleGroupItem value="credit" className="h-10 flex-1 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">{t("partners.credit")}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
        )} />
        <Controller control={control} name="openingBalanceDate" render={({ field }) => (
          <Field><FieldLabel htmlFor="openingBalanceDate">{t("common.date")}</FieldLabel><Input id="openingBalanceDate" type="date" className="h-10" disabled={locked} {...field} /></Field>
        )} />
      </div>
    </SectionCard>
  )
}
