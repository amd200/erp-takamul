import { useEffect, useRef, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { ImagePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { FormInput, FormSelect, FormSwitch } from "@/components/form/FormFields"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney } from "@/lib/format"
import { usePrinterOptions } from "@/shared/printers/usePrinters"
import { CurrencySymbol, useAppSettings } from "@/modules/settings"
import { useTaxes } from "@/modules/taxes/service"
import { priceBreakdown } from "../../pricing"
import { kindRules, type ProductForm } from "../../schema"

export function PriceSummary() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const [price, taxId, calc, cost] = useWatch({ control, name: ["sellingPrice", "taxId", "taxCalculation", "costPrice"] })
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const { data: taxes = [] } = useTaxes()
  const rate = taxSetting === "Exempt" ? 0 : taxes.find((x) => x.id === taxId)?.amount ?? 0
  const p = priceBreakdown(price || 0, rate, calc, cost || 0)

  return (
    <SectionCard title={t("products.sections.summary")}>
      <dl className="flex flex-col gap-2.5 tabular-nums">
        <div className="flex justify-between"><dt className="text-muted-foreground">{t("products.beforeTax")}</dt><dd>{formatMoney(p.before)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">{t("products.taxAmount", { rate })}</dt><dd>{formatMoney(p.tax)}</dd></div>
        <div className="flex justify-between border-t pt-2.5 text-base font-semibold"><dt>{t("products.finalPrice")}</dt><dd>{formatMoney(p.after)} <span className="text-xs font-normal text-muted-foreground"><CurrencySymbol /></span></dd></div>
        <div className="flex items-center justify-between pt-1">
          <dt className="text-muted-foreground">{t("products.margin")}</dt>
          <dd><Badge variant={p.margin < 10 ? "warning" : "success"}>{p.margin.toFixed(0)}%</Badge></dd>
        </div>
      </dl>
    </SectionCard>
  )
}

const MAX_IMAGE = 2 * 1024 * 1024

/** Pick or drop one image; shows the current one when editing. Removing it means no image is sent. */
export function ImagePanel() {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const image = useWatch({ control, name: "image" })
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreview(typeof image === "string" && image ? image : null)
  }, [image])

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return setError(t("products.imageType"))
    if (file.size > MAX_IMAGE) return setError(t("products.imageTooBig"))
    setError(null)
    setValue("image", file, { shouldDirty: true })
  }

  return (
    <SectionCard title={t("products.sections.image")}>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={t("products.imageDrop")}
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
      {preview ? (
        <div className="flex flex-col gap-2">
          <img src={preview} alt="" className="h-40 w-full rounded-xl border bg-muted object-contain" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>{t("products.imageChange")}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setValue("image", null, { shouldDirty: true })}>{t("common.remove")}</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
          className="grid h-32 w-full place-items-center rounded-xl border border-dashed text-center text-muted-foreground hover:border-primary hover:bg-secondary/40">
          <span className="flex flex-col items-center gap-1">
            <ImagePlus className="size-6 text-faint" />
            {t("products.imageDrop")}
            <span className="text-xs text-faint">{t("products.imageLimits")}</span>
          </span>
        </button>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </SectionCard>
  )
}

export function OptionsPanel() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "type" })
  const printers = usePrinterOptions(useWatch({ control, name: "printerName" }))
  const rules = kindRules(type)

  return (
    <SectionCard title={t("products.sections.options")}>
      <FieldGroup className="gap-4">
        <FormSwitch control={control} name="isActive" label={t("products.isActive")} />
        {rules.sells && <FormSwitch control={control} name="showInSalesScreen" label={t("products.showInSales")} />}
        {rules.sells && (
          <FormSelect control={control} name="printerName" label={t("products.printer")} allowEmpty={t("products.printerFromCategory")}
            options={printers} />
        )}
        {rules.sells && <FormInput control={control} name="calories" type="number" label={t("products.calories")} placeholder={t("common.optional")} />}
        <FormInput control={control} name="displayOrder" type="number" label={t("common.displayOrder")} />
      </FieldGroup>
    </SectionCard>
  )
}
