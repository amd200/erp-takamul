import { useEffect, useMemo, type ReactNode } from "react"
import { useBlocker, useNavigate } from "react-router-dom"
import { Controller, useForm, type FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MultiPicker } from "@/components/form/MultiPicker"
import { FormInput } from "@/components/form/FormFields"
import { useCategories } from "@/modules/categories/queries"
import { useAppSettings, useLoyaltyPoints, useSaveLoyalty } from "../queries"
import { loyaltySchema, type LoyaltyValues } from "../schema"
import { loyaltyFormOf } from "../service"
import { Choice, Flag, Grid, useLabel, type FieldsProps } from "./fields"

/** Saturday first, as the week runs here; values are `DayOfWeek` / `Date.getDay()` numbers. */
const WEEK = [6, 0, 1, 2, 3, 4, 5]

/** The loyalty tab's titled box, drawn as erpv2-modern draws its settings sections (plainer than this project's `Section`). */
function LoyaltySection({ title, children, cols }: { title: string; children: ReactNode; cols?: boolean }) {
  return (
    <section className="col-span-full rounded-xl border border-input p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-bold text-foreground">{title}</h2>
      <div className={cols ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-4"}>{children}</div>
    </section>
  )
}

function LoyaltyFields({ form: { control, watch } }: FieldsProps) {
  const { t } = useTranslation()
  const label = useLabel()
  const { data: categories = [] } = useCategories()
  const v = watch("loyalty") as LoyaltyValues["loyalty"]
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0)
  const error = (message?: string) => (message ? [{ message: t(message) }] : undefined)
  const required = <>&nbsp;<span className="text-red-500">*</span></>
  return (
    <Grid>
      <Flag control={control} name="enableLoyaltyPoints" />
      <LoyaltySection title={t("settings.loyalty.sec.method")} cols>
        <Choice control={control} name="loyalty.calculationScope" values={["AllCategories", "SelectedCategories"]} />
        {v.calculationScope === "SelectedCategories" && (
          <Controller control={control} name="loyalty.selectedCategoryIds" render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="xl:col-span-2">
              <FieldLabel className="gap-x-0">{label("selectedCategoryIds")}{required}</FieldLabel>
              {/* The server takes active categories only; one already chosen stays listed so it can be removed. */}
              <MultiPicker options={categories.filter((c) => c.isActive || (field.value ?? []).includes(c.id)).map((c) => ({ value: c.id, label: c.categoryNameAr }))}
                value={field.value ?? []} onChange={field.onChange} />
              <FieldError errors={error(fieldState.error?.message)} />
            </Field>
          )} />
        )}
      </LoyaltySection>
      <LoyaltySection title={t("settings.loyalty.sec.days")}>
        <Controller control={control} name="loyalty.workingDays" render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="gap-x-0">{label("workingDays")}{required}</FieldLabel>
            <ToggleGroup type="multiple" variant="outline" className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7"
              value={((field.value as number[] | undefined) ?? []).map(String)} onValueChange={(picked) => field.onChange(WEEK.filter((d) => picked.includes(String(d))))}>
              {WEEK.map((d) => (
                <ToggleGroupItem key={d} value={String(d)}
                  className="h-10 w-full border-input bg-background font-normal text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:font-medium data-[state=on]:text-primary">
                  {t(`settings.loyalty.day.${d}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldError errors={error(fieldState.error?.message)} />
          </Field>
        )} />
      </LoyaltySection>
      <LoyaltySection title={t("settings.loyalty.sec.earning")} cols>
        <FormInput control={control} name="loyalty.earningInvoiceAmount" type="number" required label={label("earningInvoiceAmount")} />
        <FormInput control={control} name="loyalty.earnedPoints" type="number" required label={label("earnedPoints")} />
        <p className="col-span-full border-t pt-3 text-sm text-muted-foreground" aria-live="polite">
          {t("settings.loyalty.earningSummary", { amount: n(v.earningInvoiceAmount), points: n(v.earnedPoints) })}
        </p>
      </LoyaltySection>
      <LoyaltySection title={t("settings.loyalty.sec.redemption")} cols>
        <FormInput control={control} name="loyalty.minimumRedemptionInvoiceAmount" type="number" required label={label("minimumRedemptionInvoiceAmount")} />
        <FormInput control={control} name="loyalty.redemptionPoints" type="number" required label={label("redemptionPoints")} />
        <FormInput control={control} name="loyalty.redemptionDiscountAmount" type="number" required label={label("redemptionDiscountAmount")} />
        <p className="col-span-full border-t pt-3 text-sm text-muted-foreground" aria-live="polite">
          {t("settings.loyalty.redemptionSummary", { points: n(v.redemptionPoints), amount: n(v.redemptionDiscountAmount), min: n(v.minimumRedemptionInvoiceAmount) })}
        </p>
      </LoyaltySection>
    </Grid>
  )
}

/**
 * The loyalty tab: the rules from GET /LoyaltyPoints and the switch from GET /Settings, in the sales settings' look
 * (grid + cancel / save footer). Saving waits for the record to be read, so a slow answer cannot be overwritten with
 * the defaults.
 */
export function LoyaltyTab({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useAppSettings()
  const record = useLoyaltyPoints()
  const save = useSaveLoyalty()
  const saved = useMemo(() => loyaltyFormOf(record.data, settings.enableLoyaltyPoints), [record.data, settings.enableLoyaltyPoints])
  const form = useForm<FieldValues>({ resolver: zodResolver(loyaltySchema) as never, defaultValues: saved })
  useEffect(() => { form.reset(saved) }, [saved, form])
  const blocker = useBlocker(({ currentLocation, nextLocation }) => form.formState.isDirty && currentLocation.pathname !== nextLocation.pathname)
  const submit = form.handleSubmit((data) => save.mutate({ data: data as LoyaltyValues, saved }))

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={readOnly || !record.isSuccess} className="contents"><LoyaltyFields form={form} /></fieldset>
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
