import { useState } from "react"
import { Controller, useFieldArray, useFormContext, type Path } from "react-hook-form"
import { Eye, Trash2, UserRoundPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { emptyCompanion, type CustomerForm } from "../schema"
import type { EyeField } from "../types"

/** "" for the customer's own fields, `companions.${i}.` for a companion's. */
type Prefix = "" | `companions.${number}.`

const ROWS: { label: string; right: EyeField; left: EyeField }[] = [
  { label: "SPH", right: "sphRight", left: "sphLeft" },
  { label: "CYL", right: "cylRight", left: "cylLeft" },
  { label: "AXIS", right: "axisRight", left: "axisLeft" },
]

/** Shown with two decimals (none for the axis and IPD) until the field is being typed in; the saved text is never changed. */
function shown(value: string | undefined, decimals: 2 | "auto") {
  const text = String(value ?? "").trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return text
  const n = Number(text)
  if (!Number.isFinite(n)) return text
  const sign = text.startsWith("+") ? "+" : text.startsWith("-") ? "-" : ""
  return sign + (decimals === "auto" ? String(Math.abs(n)) : Math.abs(n).toFixed(decimals))
}

function EyeInput({ name, placeholder, label, inTable }: { name: Path<CustomerForm>; placeholder?: string; label: string; inTable?: boolean }) {
  const { control } = useFormContext<CustomerForm>()
  const [focused, setFocused] = useState(false)
  const key = name.split(".").pop()
  const decimals = key === "axisLeft" || key === "axisRight" || key === "ipd" ? "auto" : 2
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <Input {...field} dir="ltr" inputMode="decimal" aria-label={label} placeholder={placeholder ?? "0.00"}
        value={focused ? (field.value as string | undefined) ?? "" : shown(field.value as string | undefined, decimals)}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); field.onBlur() }}
        // Keep signed decimal text without converting it to a number.
        onChange={(e) => field.onChange(e.target.value.replace(/[^\d.+-]/g, "").replace(/(?!^)[+-]/g, "").replace(/(\..*)\./g, "$1"))}
        className={inTable
          ? "h-9 rounded-sm border-transparent bg-transparent text-center font-normal tabular-nums shadow-none focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring/20"
          : "h-9 text-center font-normal tabular-nums shadow-none"} />
    )} />
  )
}

/** The contact lens values, right and left in one box: free text, kept as typed. */
function ContactLens({ path }: { path: (k: EyeField) => Path<CustomerForm> }) {
  const { control } = useFormContext<CustomerForm>()
  return (
    <div className="grid h-9 grid-cols-[2.5rem_1fr_1fr] items-center self-end rounded-md border border-input text-center">
      <span className="content-center self-stretch border-e border-border/60 font-semibold text-muted-foreground">C.L</span>
      {(["clRight", "clLeft"] as const).map((k) => (
        <div key={k} className={cn("grid h-full min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center", k === "clLeft" && "border-s border-border/60")}>
          <label htmlFor={path(k)} className="content-center self-stretch border-e border-border/60 font-semibold text-muted-foreground">{k === "clRight" ? "R" : "L"}</label>
          <Controller control={control} name={path(k)} render={({ field }) => (
            <Input {...field} id={path(k)} value={(field.value as string | undefined) ?? ""} dir="ltr" aria-label={`C.L ${k === "clRight" ? "R" : "L"}`}
              className="h-full min-h-8 rounded-sm border-transparent bg-transparent px-1 text-center font-normal shadow-none focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring/20" />
          )} />
        </div>
      ))}
    </div>
  )
}

/** The eye prescription table of the current system: RIGHT and LEFT with SPH, CYL and AXIS on the DIST row, then IPD, ADD and the contact lens values. */
export function EyePrescriptionBox({ prefix = "", bare }: { prefix?: Prefix; bare?: boolean }) {
  const { t } = useTranslation()
  const path = (k: EyeField) => `${prefix}${k}` as Path<CustomerForm>
  return (
    <div className={cn("col-span-2", !bare && "rounded-lg border border-border/60 bg-background p-3 sm:p-4")}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><Eye size={16} />{t("custDialog.eyePrescription")}</div>
      <div className="overflow-x-auto rounded-md border border-border/60">
        <table dir="ltr" className="w-full min-w-[560px] table-fixed border-collapse text-center text-xs">
          <colgroup><col className="w-14" /><col span={6} /></colgroup>
          <thead className="bg-muted/20 text-muted-foreground [&_th]:font-semibold">
            <tr className="border-b border-border/60 bg-emerald-50/50">
              <th rowSpan={2} aria-label={t("custDialog.eyePrescription")} />
              <th scope="colgroup" colSpan={3} className="border-x border-border/60 px-2 py-2">RIGHT</th>
              <th scope="colgroup" colSpan={3} className="px-2 py-2">LEFT</th>
            </tr>
            <tr className="border-b border-border/60 bg-zinc-50">
              {(["right", "left"] as const).flatMap((side) => ROWS.map((r) => <th key={`${side}-${r.label}`} scope="col" className="border-s border-border/60 px-1 py-1.5">{r.label}</th>))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <th scope="row" className="px-2 py-2 font-semibold text-muted-foreground">DIST</th>
              {(["right", "left"] as const).flatMap((side) => ROWS.map((r) => (
                <td key={`${side}-${r.label}`} className="border-s border-border/60 p-1">
                  <EyeInput inTable name={path(r[side])} label={`DIST ${side.toUpperCase()} ${r.label}`} placeholder={r.label === "AXIS" ? "0°" : undefined} />
                </td>
              )))}
            </tr>
            <tr className="border-b border-border/60">
              <td colSpan={7} className="px-3 py-2">
                <div dir="ltr" className="grid grid-cols-3 gap-3 text-start">
                  <label className="space-y-1 text-xs font-semibold text-muted-foreground"><span>IPD</span><EyeInput name={path("ipd")} label="IPD" placeholder="mm" /></label>
                  <label className="space-y-1 text-xs font-semibold text-muted-foreground"><span>ADD</span><EyeInput name={path("add")} label="ADD" /></label>
                  <ContactLens path={path} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** The people who come with the customer, each with their own name, phone and prescription, and the dashed button that adds one. */
export function CompanionsBlock() {
  const { t } = useTranslation()
  const { control } = useFormContext<CustomerForm>()
  const { fields, append, remove } = useFieldArray({ control, name: "companions", keyName: "fieldKey" })
  return (
    <>
      {fields.map((c, i) => (
        <div key={c.fieldKey} className="col-span-2 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-foreground"><UserRoundPlus size={16} />{t("custDialog.companion")} {i + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label={t("custDialog.remove")} onClick={() => remove(i)}><Trash2 size={16} /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Controller control={control} name={`companions.${i}.name`} render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>{t("custDialog.companionName")} <span className="text-red-500">*</span></FieldLabel>
                <Input {...field} placeholder={t("custDialog.companionName")} />
                {fieldState.error && <p className="text-sm text-destructive">{t(fieldState.error.message ?? "")}</p>}
              </Field>
            )} />
            <Controller control={control} name={`companions.${i}.phone`} render={({ field }) => (
              <Field><FieldLabel>{t("custDialog.companionPhone")}</FieldLabel><Input {...field} value={field.value ?? ""} type="tel" dir="ltr" placeholder={t("custDialog.mobileHint")} /></Field>
            )} />
            <EyePrescriptionBox prefix={`companions.${i}.`} bare />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="col-span-2 h-11 gap-2 border-dashed" onClick={() => append(emptyCompanion())}><UserRoundPlus size={18} />{t("custDialog.addCompanion")}</Button>
    </>
  )
}
