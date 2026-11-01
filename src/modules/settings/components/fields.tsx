import type { ReactNode } from "react"
import { Controller, type Control, type FieldValues, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FormSelect } from "@/components/form/FormFields"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** What every tab's fields component receives. */
export type FieldsProps = { form: UseFormReturn<FieldValues> }

/** A field's label: the last part of its name ("generalTab.rowsPerPage" → settings.f.rowsPerPage). */
export function useLabel() {
  const { t } = useTranslation()
  return (name: string) => t(`settings.f.${name.split(".").pop()}`)
}

const Star = () => <span className="text-red-500">*</span>

/** An on/off setting, drawn as the old system does: a تمكين / تعطيل select. Other words can replace them. */
export function Flag({ control, name, on, off }: { control: Control<FieldValues>; name: string; on?: string; off?: string }) {
  const { t } = useTranslation()
  const label = useLabel()
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <Field>
        <FieldLabel htmlFor={name} className="gap-x-0">{label(name)}&nbsp;<Star /></FieldLabel>
        <Select value={field.value === true ? "on" : "off"} onValueChange={(v) => field.onChange(v === "on")}>
          <SelectTrigger id={name} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="on">{on ?? t("settings.enable")}</SelectItem>
            <SelectItem value="off">{off ?? t("settings.disable")}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    )} />
  )
}

/** A choice among an enum's names, as the server sends them ("Pos1", "Type2", ...). */
export function Choice({ control, name, values }: { control: Control<FieldValues>; name: string; values: string[] }) {
  const { t } = useTranslation()
  const label = useLabel()
  const key = name.split(".").pop()
  return <FormSelect control={control} name={name} required label={label(name)} options={values.map((v) => ({ value: v, label: t(`settings.o.${key}.${v}`) }))} />
}

/** The two-column grid every tab lays its fields in. */
export const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>

/** A titled bordered box spanning the whole grid, as the old system groups related settings. */
export function Section({ title, children, cols }: { title: string; children: ReactNode; cols?: boolean }) {
  return (
    <section className="col-span-full rounded-xl border border-input p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-bold text-foreground">{title}</h2>
      <div className={cols ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-4"}>{children}</div>
    </section>
  )
}

/** An on/off setting drawn as the old system's bordered checkbox tile (used inside a Section). */
export function Check({ control, name }: { control: Control<FieldValues>; name: string }) {
  const label = useLabel()
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <div className="flex min-h-14 min-w-0 items-center gap-3 rounded-lg border border-input px-4">
        <Checkbox id={name} checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} />
        <label htmlFor={name} className="cursor-pointer text-sm font-medium">{label(name)}</label>
      </div>
    )} />
  )
}
