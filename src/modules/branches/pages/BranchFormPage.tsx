import { useEffect, useMemo, useRef } from "react"
import { Controller, FormProvider, useController, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { imageError } from "@/lib/image"
import { ArrowLeft, ArrowRight, ImagePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { FormInput, FormTextarea } from "@/components/form/FormFields"
import { useBranch, useSaveBranch } from "../queries"
import { branchSchema, branchFormValues, emptyBranch, type BranchForm } from "../schema"

/** A picture for the invoice (logo or stamp): drop or pick a file, see it, remove it. */
function ImageDrop({ file: fileName, url: urlName, label, current, readOnly }: {
  file: "image" | "stampImage"; url: "imageUrl" | "stampImageUrl"; label: string; current: string; readOnly?: boolean
}) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<BranchForm>()
  const { field, fieldState } = useController({ control, name: fileName })
  const input = useRef<HTMLInputElement>(null)
  const picked = field.value
  const preview = useMemo(() => (picked ? URL.createObjectURL(picked) : current || null), [picked, current])
  useEffect(() => () => { if (picked && preview) URL.revokeObjectURL(preview) }, [picked, preview])
  const take = (f?: File) => {
    if (!f || readOnly) return
    const err = imageError(f)
    if (err) return void toast.error(t(err))
    field.onChange(f)
  }
  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files[0]) }}>
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted/40">
          {preview ? <img src={preview} alt="" className="size-full object-contain" /> : <ImagePlus className="size-6 text-faint" />}
        </div>
        <div className="flex flex-col gap-1">
          <input ref={input} type="file" accept="image/png,image/jpeg" aria-label={label} className="sr-only" onChange={(e) => { take(e.target.files?.[0]); e.target.value = "" }} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={readOnly} onClick={() => input.current?.click()}>{t("products.imageChange")}</Button>
            {preview && !readOnly && <Button type="button" variant="ghost" onClick={() => { field.onChange(null); setValue(urlName, "") }}>{t("common.delete")}</Button>}
          </div>
          <span className="text-xs text-muted-foreground">{t("branchForm.imageHint")}</span>
        </div>
      </div>
      <FieldError errors={fieldState.error?.message ? [{ message: t(fieldState.error.message) }] : undefined} />
    </Field>
  )
}

export default function BranchFormPage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const view = useLocation().pathname.endsWith("/view")
  const editId = id ? Number(id) : undefined
  const { data: existing, isLoading } = useBranch(editId)
  const save = useSaveBranch()
  const form = useForm<BranchForm>({ resolver: zodResolver(branchSchema), defaultValues: emptyBranch })

  useEffect(() => {
    if (!existing) return
    form.reset(branchFormValues(existing))
  }, [existing, form])

  // Changing the region empties the city, as in the current system.
  useEffect(() => {
    const sub = form.watch((_, { name, type }) => { if (name === "stateName" && type === "change") form.setValue("cityName", "") })
    return () => sub.unsubscribe()
  }, [form])

  if (editId && isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />

  const submit = form.handleSubmit((data) => save.mutate({ id: editId, data, current: existing }, { onSuccess: () => nav("/branches") }))
  const c = form.control
  const BackIcon = i18n.dir() === "rtl" ? ArrowRight : ArrowLeft
  const state = form.watch("stateName")
  const imageUrl = form.watch("imageUrl")
  const stampImageUrl = form.watch("stampImageUrl")

  const title = view ? t("branchForm.viewTitle") : editId ? t("branchForm.editTitle") : t("branchForm.addTitle")
  const subtitle = view ? t("branchForm.details") : t("branchForm.desc")
  const ro = view

  const grid = "grid gap-4 sm:grid-cols-2"
  const logo = <ImageDrop file="image" url="imageUrl" label={t("branchForm.logo")} current={imageUrl} readOnly={ro} />
  const stamp = <ImageDrop file="stampImage" url="stampImageUrl" label={t("branchForm.stamp")} current={stampImageUrl} readOnly={ro} />
  const identity = (
    <div className={grid}>
      <FormInput control={c} name="code" readOnly={ro} required label={t("branchForm.code")} placeholder={t("branchForm.codePh")} dir="ltr" />
      <FormInput control={c} name="name" readOnly={ro} required label={t("branchForm.businessName")} placeholder={t("branchForm.businessNamePh")} />
      <FormInput control={c} name="nameEn" readOnly={ro} label={t("branchForm.nameEn")} placeholder={t("branchForm.nameEn")} dir="ltr" />
      <FormInput control={c} name="shortName" readOnly={ro} label={t("branchForm.shortName")} placeholder={t("branchForm.shortName")} />
      <FormInput control={c} name="shortNameEn" readOnly={ro} label={t("branchForm.shortNameEn")} placeholder={t("branchForm.shortNameEn")} dir="ltr" />
      <FormInput control={c} name="phone" readOnly={ro} label={t("branchForm.phone")} placeholder={t("branchForm.phonePh")} dir="ltr" />
      {logo}
      {stamp}
    </div>
  )
  const tax = (
    <div className={grid}>
      <FormInput control={c} name="taxNumber" readOnly={ro} label={t("branchForm.taxNumber")} placeholder="3XXXXXXXXXXXXX3" dir="ltr" />
      <FormInput control={c} name="commercialRegister" readOnly={ro} label={t("branchForm.commercialRegister")} placeholder={t("branchForm.commercialRegisterPh")} dir="ltr" />
      <FormInput control={c} name="organizationUnitName" readOnly={ro} required label={t("branchForm.unitName")} placeholder={t("branchForm.unitNamePh")} />
      <FormInput control={c} name="industryBusinessCategory" readOnly={ro} required label={t("branchForm.businessCategory")} placeholder={t("branchForm.businessCategoryPh")} />
      <div className="sm:col-span-2"><FormTextarea control={c} name="footerNote" readOnly={ro} label={t("branchForm.footer")} placeholder={t("branchForm.footerPh")} /></div>
    </div>
  )
  const bank = (
    <div className={grid}>
      <FormInput control={c} name="iban" readOnly={ro} label="IBAN" placeholder="SA00 0000 0000 0000 0000 0000" dir="ltr" />
      <FormInput control={c} name="bankAccountNumber" readOnly={ro} label={t("branchForm.accountNumber")} placeholder={t("branchForm.accountNumber")} dir="ltr" />
      <FormInput control={c} name="bankName" readOnly={ro} label={t("branchForm.bankName")} placeholder={t("branchForm.bankName")} />
      <FormInput control={c} name="bankNameEn" readOnly={ro} label={t("branchForm.bankNameEn")} placeholder={t("branchForm.bankNameEnPh")} dir="ltr" />
      <FormInput control={c} name="bankAccountName" readOnly={ro} label={t("branchForm.accountName")} placeholder={t("branchForm.accountName")} />
      <FormInput control={c} name="bankAccountNameEn" readOnly={ro} label={t("branchForm.accountNameEn")} placeholder={t("branchForm.accountNameEnPh")} dir="ltr" />
    </div>
  )
  const address = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field>
        <FieldLabel>{t("branchForm.country")}<span className="text-destructive">*</span></FieldLabel>
        <input value="SA" disabled readOnly aria-label={t("branchForm.country")} className="h-10 w-full cursor-not-allowed rounded-md border bg-muted/40 px-3 text-sm" />
      </Field>
      <FormInput control={c} name="stateName" readOnly={ro} required label={t("branchForm.region")} placeholder={t("branchForm.enterRegion")} />
      <FormInput control={c} name="cityName" readOnly={ro} required label={t("branchForm.city")} disabled={!state || ro} placeholder={state ? t("branchForm.enterCity") : t("branchForm.selectRegionFirst")} />
      <FormInput control={c} name="district" readOnly={ro} label={t("branchForm.neighborhood")} placeholder={t("branchForm.neighborhood")} />
      <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:flex lg:items-start">
      <FormInput className="lg:min-w-0 lg:flex-1" control={c} name="street" readOnly={ro} label={t("branchForm.street")} placeholder={t("branchForm.streetPh")} />
      <FormInput className="lg:min-w-0 lg:flex-1" control={c} name="buildingNumber" readOnly={ro} label={`${t("branchForm.buildingNumber")} (ex:1234)`} placeholder="0000" dir="ltr" />
      <FormInput className="lg:min-w-0 lg:flex-1" control={c} name="subNumber" readOnly={ro} label={`${t("branchForm.subNumber")} (ex:1234)`} placeholder="0000" dir="ltr" />
      <FormInput className="lg:min-w-0 lg:flex-1" control={c} name="postalCode" readOnly={ro} label={`${t("branchForm.postalCode")} (ex:12345)`} placeholder="00000" dir="ltr" />
      <Controller control={c} name="locationAddress" render={({ field }) => (
        <Field className="sm:col-span-2 lg:w-fit lg:shrink-0">
          <FieldLabel>{t("branchForm.shortAddress")}</FieldLabel>
          <InputOTP maxLength={8} disabled={ro} value={field.value ?? ""} onChange={(v) => field.onChange(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} containerClassName="w-fit gap-1.5 [direction:ltr]" dir="ltr">
            <InputOTPGroup className="gap-1.5" dir="ltr">
              {Array.from({ length: 8 }, (_, i) => <InputOTPSlot key={i} index={i} className="size-8 rounded-md border font-mono" />)}
            </InputOTPGroup>
          </InputOTP>
        </Field>
      )} />
      </div>
    </div>
  )
  const backLink = <Link to="/branches">{t("branchForm.back")}<BackIcon /></Link>

  // erpv2 layout in both looks (PageHeader and SectionCard switch colours/style by theme): section cards and a sticky save bar.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <PageHeader title={title} description={subtitle} actions={<Button asChild variant="outline">{backLink}</Button>} />
        <SectionCard title={t("branchForm.sections.identity")}>{identity}</SectionCard>
        <SectionCard title={t("branchForm.sections.tax")} description={t("branchForm.taxHint")}>{tax}</SectionCard>
        <SectionCard title={t("branchForm.sections.bank")}>{bank}</SectionCard>
        <SectionCard title={t("branchForm.sections.address")}>{address}</SectionCard>
        {!view && (
          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <span className="text-sm text-destructive" role="status">{form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="lg"><Link to="/branches">{t("common.cancel")}</Link></Button>
              <Button type="submit" size="lg" disabled={save.isPending}>{editId ? t("branchForm.saveChanges") : t("branchForm.add")}</Button>
            </div>
          </div>
        )}
      </form>
    </FormProvider>
  )
}
