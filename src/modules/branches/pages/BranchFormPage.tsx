import { useEffect, useRef } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ImagePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { FormInput, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useBranch, useSaveBranch } from "../queries"
import { branchSchema, branchFormValues, emptyBranch, type BranchForm } from "../schema"

const MAX_IMAGE = 2 * 1024 * 1024

/** A picture for the invoice (logo or stamp): pick a file, see it, or keep the one already saved. */
function ImageField({ name, label, current, control }: { name: "image" | "stampImage"; label: string; current: string | null; control: ReturnType<typeof useForm<BranchForm>>["control"] }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  return (
    <Controller control={control} name={name} render={({ field, fieldState }) => {
      const url = field.value ? URL.createObjectURL(field.value) : current
      return (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <div className="flex items-center gap-3">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted/40">
              {url ? <img src={url} alt="" className="size-full object-contain" /> : <ImagePlus className="size-6 text-faint" />}
            </div>
            <div className="flex flex-col gap-1">
              <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={label}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f && f.size <= MAX_IMAGE) field.onChange(f) }} />
              <Button type="button" variant="outline" onClick={() => input.current?.click()}>{t("products.imageChange")}</Button>
              <span className="text-xs text-muted-foreground">{t("branches.imageHint")}</span>
              {fieldState.error && <span className="text-xs text-destructive">{t("products.imageTooBig")}</span>}
            </div>
          </div>
        </Field>
      )
    }} />
  )
}

export default function BranchFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : undefined
  const { data: existing, isLoading } = useBranch(editId)
  const save = useSaveBranch()
  const form = useForm<BranchForm>({ resolver: zodResolver(branchSchema), defaultValues: emptyBranch })

  useEffect(() => {
    if (!existing) return
    form.reset(branchFormValues(existing))
  }, [existing, form])

  if (editId && isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />

  const submit = form.handleSubmit((data) => save.mutate({ id: editId, data, current: existing }, { onSuccess: () => nav("/branches") }))
  const c = form.control

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <PageHeader crumbs={[t("nav.branches")]} title={editId ? t("branches.editTitle", { name: existing?.name || "—" }) : t("branches.add")} />

        <SectionCard title={t("branches.sections.identity")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={c} name="code" required label={t("branches.code")} dir="ltr" />
            <FormInput control={c} name="name" required label={t("branches.name")} />
            <FormInput control={c} name="nameEn" label={t("branches.nameEn")} dir="ltr" />
            <FormInput control={c} name="shortName" label={t("branches.shortName")} />
            <FormInput control={c} name="shortNameEn" label={t("branches.shortNameEn")} dir="ltr" />
            <FormInput control={c} name="phone" label={t("users.mobile")} dir="ltr" />
            <ImageField name="image" label={t("branches.logo")} current={existing?.imageUrl ?? null} control={c} />
            <ImageField name="stampImage" label={t("branches.stamp")} current={existing?.stampImageUrl ?? null} control={c} />
          </div>
        </SectionCard>

        <SectionCard title={t("branches.sections.tax")} description={t("branches.taxHint")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={c} name="taxNumber" label={t("partners.taxNumber")} dir="ltr" placeholder="3XXXXXXXXXXXXX3" />
            <FormInput control={c} name="commercialRegister" label={t("partners.commercialRegister")} dir="ltr" />
            <FormInput control={c} name="organizationUnitName" label={t("branches.orgUnit")} />
            <FormInput control={c} name="industryBusinessCategory" label={t("branches.industry")} />
            <div className="sm:col-span-2"><FormTextarea control={c} name="footerNote" label={t("branches.footerNote")} /></div>
          </div>
        </SectionCard>

        <SectionCard title={t("branches.sections.bank")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={c} name="iban" label="IBAN" dir="ltr" />
            <FormInput control={c} name="bankAccountNumber" label={t("branches.accountNumber")} dir="ltr" />
            <FormInput control={c} name="bankName" label={t("branches.bankName")} />
            <FormInput control={c} name="bankNameEn" label={t("branches.bankNameEn")} dir="ltr" />
            <FormInput control={c} name="bankAccountName" label={t("branches.accountName")} />
            <FormInput control={c} name="bankAccountNameEn" label={t("branches.accountNameEn")} dir="ltr" />
          </div>
        </SectionCard>

        <SectionCard title={t("branches.sections.address")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormInput control={c} name="stateName" label={t("partners.state")} />
            <FormInput control={c} name="cityName" label={t("partners.city")} />
            <FormInput control={c} name="district" label={t("partners.district")} />
            <FormInput control={c} name="street" label={t("partners.street")} />
            <FormInput control={c} name="buildingNumber" label={t("partners.buildingNumber")} dir="ltr" />
            <FormInput control={c} name="subNumber" label={t("partners.additionalNumber")} dir="ltr" />
            <FormInput control={c} name="postalCode" label={t("partners.postalCode")} dir="ltr" />
            <FormInput control={c} name="locationAddress" label={t("branches.locationAddress")} />
          </div>
        </SectionCard>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <span className="text-sm text-destructive" role="status">{form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="lg"><Link to="/branches">{t("common.cancel")}</Link></Button>
            <Button type="submit" size="lg" disabled={save.isPending}>{editId ? t("common.saveChanges") : t("common.save")}</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
