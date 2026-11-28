import { useEffect, useMemo, type ReactNode } from "react"
import { useBlocker, useNavigate } from "react-router-dom"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { MultiPicker } from "@/components/form/MultiPicker"
import { NumberText } from "@/components/form/FormFields"
import { useCategories } from "@/modules/categories/queries"
import { useAppSettings, useLoyaltyPoints, useSaveLoyalty } from "../queries"
import { loyaltySchema, type LoyaltyValues } from "../schema"
import { loyaltyFormOf } from "../service"
import type { LoyaltyWorkingDay } from "../types"

/** Saturday first, as the week runs here; the saved list keeps this order. */
const WEEK: LoyaltyWorkingDay[] = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const SCOPES = ["AllCategories", "SelectedCategories"] as const
/** Ticked boxes in this tab fill with the theme colour and a white tick (for the categories list too, through its slot). */
const CHECKED = "data-[state=checked]:border-primary! data-[state=checked]:bg-primary! data-[state=checked]:text-white!"
const LIST_CHECKED = "[&_[data-slot=checkbox][data-state=checked]]:border-primary! [&_[data-slot=checkbox][data-state=checked]]:bg-primary! [&_[data-slot=checkbox][data-state=checked]]:text-white!"
type NumberName = "earningInvoiceAmount" | "earnedPoints" | "redemptionPoints" | "minimumRedemptionInvoiceAmount" | "redemptionDiscountAmount"

/** A block of loyalty settings, as the current system draws it: a title with a line of help, then its fields. */
function Block({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <section className="h-full rounded-md border border-border bg-card">
      <header className="border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{help}</p>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

/** A labelled number box with an optional unit inside it, after the number, and a hint under it. */
function NumberField({ control, name, unit, hint }: { control: Control<LoyaltyValues>; name: NumberName; unit?: string; hint?: string }) {
  const { t } = useTranslation()
  const id = `loyalty.${name}`
  return (
    <Controller control={control} name={id as `loyalty.${NumberName}`} render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid} className="gap-1.5">
        <FieldLabel htmlFor={id} className="gap-x-2 text-xs text-muted-foreground">{t(`settings.f.${name}`)}</FieldLabel>
        <div className="relative">
          <NumberText name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onValue={(v) => field.onChange(v)} empty={undefined}
            id={id} step="any" inputMode="decimal" aria-invalid={fieldState.invalid} className={cn("h-10", unit && "pe-14")} />
          {unit && <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">{unit}</span>}
        </div>
        {hint && !fieldState.error && <p className="text-xs text-muted-foreground">{hint}</p>}
        <FieldError errors={fieldState.error?.message ? [{ message: t(fieldState.error.message) }] : undefined} />
      </Field>
    )} />
  )
}

function LoyaltyFields({ control }: { control: Control<LoyaltyValues> }) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const scope = useWatch({ control, name: "loyalty.calculationScope" })
  const unit = t("settings.loyalty.pointUnit")
  const error = (message?: string) => (message ? [{ message: t(message) }] : undefined)
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Controller control={control} name="enableLoyaltyPoints" render={({ field }) => (
        <label htmlFor="enableLoyaltyPoints" className="flex cursor-pointer items-center justify-between gap-6 rounded-md border border-border bg-card px-5 py-4 lg:col-span-2">
          <span className="space-y-0.5">
            <span className="block text-sm font-bold text-foreground">{t("settings.f.enableLoyaltyPoints")}</span>
            <span className="block text-xs leading-relaxed text-muted-foreground">{t("settings.loyalty.intro")}</span>
          </span>
          <Switch id="enableLoyaltyPoints" checked={field.value} onCheckedChange={field.onChange} />
        </label>
      )} />

      <Block title={t("settings.loyalty.sec.method")} help={t("settings.loyalty.desc.method")}>
        <Controller control={control} name="loyalty.calculationScope" render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} aria-label={t("settings.f.calculationScope")} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SCOPES.map((s) => (
              <label key={s} className={cn("flex cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3 text-sm transition-colors",
                field.value === s ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                <RadioGroupItem value={s} className="border-primary/50 data-[state=checked]:border-primary! data-[state=checked]:bg-primary! [&_[data-slot=radio-group-indicator]>span]:bg-white!" />
                {t(`settings.o.calculationScope.${s}`)}
              </label>
            ))}
          </RadioGroup>
        )} />
        {scope === "SelectedCategories" && (
          <Controller control={control} name="loyalty.selectedCategoryIds" render={({ field, fieldState }) => (
            <div className={cn("mt-3", LIST_CHECKED)}>
              {/* The server takes active categories only; one already chosen stays listed so it can be removed. */}
              <MultiPicker options={categories.filter((c) => c.isActive || field.value.includes(c.id)).map((c) => ({ value: c.id, label: c.categoryNameAr }))}
                value={field.value} onChange={field.onChange} />
              <FieldError className="mt-2" errors={error(fieldState.error?.message)} />
            </div>
          )} />
        )}
      </Block>

      <Block title={t("settings.loyalty.sec.days")} help={t("settings.loyalty.desc.days")}>
        <Controller control={control} name="loyalty.workingDays" render={({ field, fieldState }) => (
          <div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {WEEK.map((day) => {
                const on = field.value.includes(day)
                return (
                  <label key={day} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Checkbox className={CHECKED} checked={on} onCheckedChange={() => field.onChange(WEEK.filter((d) => (d === day ? !on : field.value.includes(d))))} />
                    {t(`settings.loyalty.day.${day}`)}
                  </label>
                )
              })}
            </div>
            <FieldError className="mt-2" errors={error(fieldState.error?.message)} />
          </div>
        )} />
      </Block>

      <Block title={t("settings.loyalty.sec.earning")} help={t("settings.loyalty.desc.earning")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <NumberField control={control} name="minimumRedemptionInvoiceAmount" />
          <NumberField control={control} name="earningInvoiceAmount" hint={t("settings.loyalty.hintEvery")} />
          <NumberField control={control} name="earnedPoints" unit={unit} />
        </div>
      </Block>

      <Block title={t("settings.loyalty.sec.redemption")} help={t("settings.loyalty.desc.redemption")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField control={control} name="redemptionPoints" unit={unit} />
          <NumberField control={control} name="redemptionDiscountAmount" />
        </div>
      </Block>
    </div>
  )
}

/**
 * The loyalty tab, laid out as the current system's: the rules from GET /LoyaltyPoints and the switch from GET /Settings,
 * then the sales settings' cancel / save footer. Saving waits for the record to be read, so a slow answer cannot be
 * overwritten with the defaults.
 */
export function LoyaltyTab({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useAppSettings()
  const record = useLoyaltyPoints()
  const save = useSaveLoyalty()
  const saved = useMemo(() => loyaltyFormOf(record.data, settings.enableLoyaltyPoints), [record.data, settings.enableLoyaltyPoints])
  const form = useForm<LoyaltyValues>({ resolver: zodResolver(loyaltySchema), defaultValues: saved })
  useEffect(() => { form.reset(saved) }, [saved, form])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => form.formState.isDirty && currentLocation.pathname !== nextLocation.pathname)
  const submit = form.handleSubmit((data) => save.mutate({ data, saved }))

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={readOnly || !record.isSuccess} className="contents"><LoyaltyFields control={form.control} /></fieldset>
      {record.isError && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {t("common.loadFailed")} <Button type="button" variant="link" className="h-auto p-0" onClick={() => record.refetch()}>{t("common.retry")}</Button>
        </p>
      )}
      {readOnly && <p className="mt-4 text-sm text-muted-foreground">{t("settings.readOnly")}</p>}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 rounded border border-border px-3 py-4 sm:flex-row">
        <Button type="button" size="lg" variant="destructive" className="h-12 w-full px-8 sm:w-auto" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
        {!readOnly && <Button type="submit" size="lg" className="h-12 w-full px-8 text-base sm:w-auto" disabled={save.isPending || !record.isSuccess}>{t("settings.saveSettings")}</Button>}
      </div>
      <ConfirmDialog open={blocker.state === "blocked"} onOpenChange={(o) => !o && blocker.reset?.()}
        title={t("settings.leaveTitle")} description={t("settings.leaveBody")} confirmLabel={t("settings.leave")}
        onConfirm={() => blocker.proceed?.()} />
    </form>
  )
}
