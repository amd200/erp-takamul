import { useState } from "react"
import { Controller, useFieldArray, useFormContext, useWatch, type Path } from "react-hook-form"
import { Eye, Trash2, UserRoundPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormInput } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { emptyCompanion, type CustomerForm } from "../schema"
import { EYE_FIELDS, type EyeField } from "../types"

/** "" for the customer's own fields, `companions.${i}.` for a companion's. */
type Prefix = "" | `companions.${number}.`

const ROWS: { label: string; right: EyeField; left: EyeField }[] = [
  { label: "SPH", right: "sphRight", left: "sphLeft" },
  { label: "CYL", right: "cylRight", left: "cylLeft" },
  { label: "AXIS", right: "axisRight", left: "axisLeft" },
]

/** The server stores these as numbers: keep only a sign, digits and one decimal point. */
const numeric = (v: string) => v.replace(/[^\d.+-]/g, "").replace(/(?!^)[+-]/g, "").replace(/(\..*)\./g, "$1")

function EyeInput({ name, placeholder = "0.00", label }: { name: Path<CustomerForm>; placeholder?: string; label: string }) {
  const { control } = useFormContext<CustomerForm>()
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <Input {...field} value={(field.value as string | undefined) ?? ""} onChange={(e) => field.onChange(numeric(e.target.value))}
        dir="ltr" inputMode="decimal" placeholder={placeholder} aria-label={label} className="h-10 text-center font-semibold tabular-nums" />
    )} />
  )
}

/** Laid out physically left to right in every language: label | left eye | right eye. */
export function MeasurementTable({ prefix = "" }: { prefix?: Prefix }) {
  const { t } = useTranslation()
  const path = (k: EyeField) => `${prefix}${k}` as Path<CustomerForm>
  const head = "text-center text-xs font-bold text-muted-foreground"
  const rowLabel = "text-xs font-extrabold tracking-wide"
  return (
    <div dir="ltr" className="grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2">
      <span />
      <span className={head}>{t("customers.leftEye")} (L)</span>
      <span className={head}>{t("customers.rightEye")} (R)</span>
      {ROWS.map((r) => (
        <div key={r.label} className="contents">
          <span className={rowLabel}>{r.label}</span>
          <EyeInput name={path(r.left)} label={`${r.label} L`} placeholder={r.label === "AXIS" ? "0°" : undefined} />
          <EyeInput name={path(r.right)} label={`${r.label} R`} placeholder={r.label === "AXIS" ? "0°" : undefined} />
        </div>
      ))}
      <div className="col-span-3 mt-1 border-t" />
      <span className={rowLabel}>ADD</span>
      <div className="col-span-2"><EyeInput name={path("add")} label="ADD" /></div>
      <span className={rowLabel}>IPD</span>
      <div className="col-span-2"><EyeInput name={path("ipd")} label="IPD" placeholder="mm" /></div>
    </div>
  )
}

/** A button that reveals the customer's own measurements, then the companions with theirs. */
export function MeasurementsSection() {
  const { t } = useTranslation()
  const { control } = useFormContext<CustomerForm>()
  // A customer who already has measurements opens with them showing, until the button is used.
  const has = useWatch({ control, name: EYE_FIELDS }).some((v) => v !== "")
  const [manual, setManual] = useState<boolean | null>(null)
  const open = manual ?? has
  const { fields, append, remove } = useFieldArray({ control, name: "companions" })
  return (
    <>
      <Button type="button" variant="outline" size="lg" className="h-11 w-full gap-2 border-dashed" onClick={() => setManual(!open)}>
        <Eye />{open ? t("customers.hideMeasurements") : t("customers.addMeasurements")}
      </Button>
      {open && <SectionCard title={t("customers.measurements")}><MeasurementTable /></SectionCard>}

      {fields.map((c, i) => (
        <SectionCard key={c.id} title={`${t("customers.companion")} ${i + 1}`}
          action={<Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={t("customers.removeCompanion")} onClick={() => remove(i)}><Trash2 /></Button>}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput control={control} name={`companions.${i}.name`} label={t("customers.companionName")} required />
              <FormInput control={control} name={`companions.${i}.phone`} label={t("customers.companionPhone")} dir="ltr" placeholder="05XXXXXXXX" />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">{t("customers.measurements")}</p>
              <MeasurementTable prefix={`companions.${i}.`} />
            </div>
          </div>
        </SectionCard>
      ))}

      <Button type="button" variant="outline" size="lg" className="h-11 w-full gap-2 border-dashed" onClick={() => append(emptyCompanion())}>
        <UserRoundPlus />{t("customers.addCompanion")}
      </Button>
    </>
  )
}
