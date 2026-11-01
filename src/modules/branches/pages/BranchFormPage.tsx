import { useEffect, useMemo, useRef } from "react"
import { Controller, FormProvider, useController, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useClassic } from "@/shared/theme/ThemeProvider"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { FormInput, FormTextarea } from "@/components/form/FormFields"
import { useBranch, useSaveBranch } from "../queries"
import { branchSchema, branchFormValues, emptyBranch, type BranchForm } from "../schema"

/** A picture for the invoice (logo or stamp): drop or pick a file, see it, remove it. */
function ImageDrop({ file: fileName, url: urlName, label, current, rich, readOnly }: {
  file: "image" | "stampImage"; url: "imageUrl" | "stampImageUrl"; label: string; current: string; rich?: boolean; readOnly?: boolean
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
    if (!f.type.startsWith("image/")) return void toast.error(t("branchForm.invalidImage"))
    field.onChange(f)
  }
  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>{label}</FieldLabel>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files[0]) }}
        onClick={() => !readOnly && input.current?.click()}
        className="relative flex min-h-[120px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border transition-all hover:border-[#2ecc71]/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20"
      >
        {preview ? (
          <div className="relative p-3">
            <img src={preview} alt={label} className="h-24 rounded-lg object-contain" />
            {!readOnly && <button type="button" aria-label={t("common.delete")} className="absolute -top-1 -right-1 rounded-full border bg-card p-0.5 shadow"
              onClick={(e) => { e.stopPropagation(); field.onChange(null); setValue(urlName, "") }}>
              <X size={13} className="text-muted-foreground" />
            </button>}
          </div>
        ) : rich ? (
          <div className="flex flex-col items-center gap-2 py-6 text-faint">
            <div className="flex size-12 items-center justify-center rounded-full border bg-card"><Upload size={20} /></div>
            <p className="text-sm font-medium text-[var(--text-main)]">{t("branchForm.dragDrop")}</p>
            <p className="text-xs">{t("branchForm.orBrowse")}</p>
            <span className="mt-1 rounded-lg border border-input px-4 py-1.5 text-xs text-[var(--text-main)] dark:text-faint">{t("branchForm.browseFiles")}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-faint"><Upload size={20} /><p className="text-sm font-medium text-[var(--text-main)]">{t("branchForm.uploadStamp")}</p></div>
        )}
        <input ref={input} type="file" accept="image/*" aria-label={label} className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = "" }} />
      </div>
      <FieldError errors={fieldState.error?.message ? [{ message: t(fieldState.error.message) }] : undefined} />
    </Field>
  )
}

export default function BranchFormPage() {
  const classic = useClassic()
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

  const basic = (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FormInput control={c} name="name" readOnly={ro} required label={t("branchForm.businessName")} placeholder={t("branchForm.businessNamePh")} />
        <FormInput control={c} name="nameEn" readOnly={ro} label={t("branchForm.nameEn")} placeholder={t("branchForm.nameEn")} />
        <FormInput control={c} name="shortName" readOnly={ro} label={t("branchForm.shortName")} placeholder={t("branchForm.shortName")} />
        <FormInput control={c} name="shortNameEn" readOnly={ro} label={t("branchForm.shortNameEn")} placeholder={t("branchForm.shortNameEn")} dir="ltr" />
        <FormInput control={c} name="code" readOnly={ro} required label={t("branchForm.code")} placeholder={t("branchForm.codePh")} />
        <FormInput control={c} name="phone" readOnly={ro} label={t("branchForm.phone")} placeholder={t("branchForm.phonePh")} />
        <FormInput control={c} name="organizationUnitName" readOnly={ro} required label={t("branchForm.unitName")} placeholder={t("branchForm.unitNamePh")} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormInput control={c} name="taxNumber" readOnly={ro} label={t("branchForm.taxNumber")} placeholder={t("branchForm.taxNumberPh")} />
        <FormInput control={c} name="commercialRegister" readOnly={ro} label={t("branchForm.commercialRegister")} placeholder={t("branchForm.commercialRegisterPh")} />
        <FormInput control={c} name="industryBusinessCategory" readOnly={ro} required label={t("branchForm.businessCategory")} placeholder={t("branchForm.businessCategoryPh")} />
        <FormInput control={c} name="iban" readOnly={ro} label="IBAN" placeholder="SA00 0000 0000 0000 0000 0000" dir="ltr" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <FormInput control={c} name="bankAccountNumber" readOnly={ro} label={t("branchForm.accountNumber")} placeholder={t("branchForm.accountNumber")} dir="ltr" />
        <FormInput control={c} name="bankName" readOnly={ro} label={t("branchForm.bankName")} placeholder={t("branchForm.bankName")} />
        <FormInput control={c} name="bankNameEn" readOnly={ro} label={t("branchForm.bankNameEn")} placeholder={t("branchForm.bankNameEnPh")} dir="ltr" />
        <FormInput control={c} name="bankAccountName" readOnly={ro} label={t("branchForm.accountName")} placeholder={t("branchForm.accountName")} />
        <FormInput control={c} name="bankAccountNameEn" readOnly={ro} label={t("branchForm.accountNameEn")} placeholder={t("branchForm.accountNameEnPh")} dir="ltr" />
      </div>
    </>
  )
  const logo = <ImageDrop file="image" url="imageUrl" label={t("branchForm.logo")} current={imageUrl} rich readOnly={ro} />
  const stamp = <ImageDrop file="stampImage" url="stampImageUrl" label={t("branchForm.stamp")} current={stampImageUrl} readOnly={ro} />
  const footer = <FormTextarea control={c} name="footerNote" readOnly={ro} label={t("branchForm.footer")} placeholder={t("branchForm.footerPh")} />
  const address = (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Field>
          <FieldLabel>{t("branchForm.country")}<span className="text-destructive">*</span></FieldLabel>
          <input value="SA" disabled readOnly aria-label={t("branchForm.country")} className="h-10 w-full cursor-not-allowed rounded-md border bg-muted/40 px-3 text-sm" />
        </Field>
        <FormInput control={c} name="stateName" readOnly={ro} required label={t("branchForm.region")} placeholder={t("branchForm.enterRegion")} />
        <FormInput control={c} name="cityName" readOnly={ro} required label={t("branchForm.city")} disabled={!state || ro} placeholder={state ? t("branchForm.enterCity") : t("branchForm.selectRegionFirst")} />
        <FormInput control={c} name="district" readOnly={ro} label={t("branchForm.neighborhood")} placeholder={t("branchForm.neighborhood")} />
        <FormInput control={c} name="street" readOnly={ro} label={t("branchForm.street")} placeholder={t("branchForm.streetPh")} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FormInput control={c} name="postalCode" readOnly={ro} label={`${t("branchForm.postalCode")} (ex:12345)`} placeholder="00000" />
        <FormInput control={c} name="buildingNumber" readOnly={ro} label={`${t("branchForm.buildingNumber")} (ex:1234)`} placeholder="0000" />
        <FormInput control={c} name="subNumber" readOnly={ro} label={`${t("branchForm.subNumber")} (ex:1234)`} placeholder="0000" />
        <Controller control={c} name="locationAddress" render={({ field }) => (
          <Field>
            <FieldLabel>{t("branchForm.shortAddress")}</FieldLabel>
            <InputOTP maxLength={8} disabled={ro} value={field.value ?? ""} onChange={(v) => field.onChange(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} containerClassName="w-fit gap-1.5" dir="ltr">
              <InputOTPGroup className="gap-1.5">
                {Array.from({ length: 8 }, (_, i) => <InputOTPSlot key={i} index={i} className="size-10 rounded-md border font-mono" />)}
              </InputOTPGroup>
            </InputOTP>
          </Field>
        )} />
      </div>
    </>
  )
  const backLink = <Link to="/branches">{t("branchForm.back")}<BackIcon /></Link>

  if (classic) {
    return (
      <FormProvider {...form}>
        <Card>
          <CardHeader>
            <CardTitle><h1 className="text-xl font-bold">{title}</h1></CardTitle>
            <CardDescription>{subtitle}</CardDescription>
            <CardAction><Button size="xl" asChild>{backLink}</Button></CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate className="space-y-5">
              <Card>
                <CardHeader><CardTitle>{t("branchForm.basicInfo")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">{basic}{logo}{stamp}{footer}</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">{t("branchForm.addressSettings")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">{address}</CardContent>
              </Card>
              {!view && <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <Button type="button" variant="destructive" className="h-12 w-full px-4 sm:w-auto" asChild><Link to="/branches">{t("common.cancel")}</Link></Button>
                <Button type="submit" disabled={save.isPending} className="h-12 w-full px-4 sm:w-auto">{editId ? t("branchForm.saveChanges") : t("branchForm.add")}</Button>
              </div>}
            </form>
          </CardContent>
        </Card>
      </FormProvider>
    )
  }

  // Modern (erpv2) look: page header with breadcrumb, one card per section, a sticky save bar.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <PageHeader crumbs={[t("nav.branches")]} title={title} description={subtitle} actions={<Button asChild variant="outline">{backLink}</Button>} />
        <SectionCard title={t("branchForm.basicInfo")}><div className="space-y-4">{basic}</div></SectionCard>
        <SectionCard title={t("branchForm.logo")}>
          <div className="grid gap-4 sm:grid-cols-2">{logo}{stamp}</div>
          <div className="mt-4">{footer}</div>
        </SectionCard>
        <SectionCard title={t("branchForm.addressSettings")}><div className="space-y-4">{address}</div></SectionCard>
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
