import { useEffect } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { Barcode, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { formatMoney } from "@/lib/format"
import { useCategories } from "@/modules/categories/queries"
import { usePrinterOptions } from "@/shared/printers/usePrinters"
import { useAppSettings } from "@/modules/settings"
import { useExemptionReasons, useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { priceBreakdown } from "../pricing"
import { kindRules, type ProductForm } from "../schema"

/**
 * The fields of the item form, each a block the page drops into one two-column grid in the order the current
 * system shows them (names, order, category, prices and tax, barcode and unit, extra units, description, image, switch).
 */
const randomBarcode = () => String(6221100000000 + Math.floor(Math.random() * 99999))

export function NamesFields() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "type" })
  return (
    <>
      <FormInput control={control} name="nameAr" required label={t("productForm.nameAr")} placeholder={t("productForm.nameArHint")} />
      <FormInput control={control} name="nameEn" dir="ltr" label={t("productForm.nameEn")} placeholder={t("productForm.nameEnHint")} />
      <FormInput control={control} name="nameUr" dir="ltr" label={t("productForm.nameUr")} placeholder={t("productForm.nameUrHint")} />
      {type !== "RawMatrial" && <FormInput control={control} name="displayOrder" type="number" label={t("productForm.displayOrder")} placeholder={t("productForm.displayOrder")} />}
    </>
  )
}

export function CategoryField() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { data: categories = [] } = useCategories()
  return (
    <FormSelect control={control} name="categoryId" numeric required label={t("productForm.category")} placeholder={t("productForm.pickCategory")}
      options={categories.map((c) => ({ value: String(c.id), label: c.parentCategoryId ? `— ${c.categoryNameAr}` : c.categoryNameAr }))} />
  )
}

/** Cost, selling price and tax; the summary box under them is spelled out as the current system does. */
export function PricingFields({ computedCost }: { computedCost: number }) {
  const { t } = useTranslation()
  const { control, setValue, getValues } = useFormContext<ProductForm>()
  const [type, taxId, price, calc] = useWatch({ control, name: ["type", "taxId", "sellingPrice", "taxCalculation"] })
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const { data: taxes = [] } = useTaxes()
  const { data: reasons = [] } = useExemptionReasons()
  const rules = kindRules(type)
  const exempt = taxSetting === "Exempt"
  const tax = taxes.find((x) => x.id === taxId)
  const zeroRate = tax?.amount === 0
  const rate = exempt ? 0 : tax?.amount ?? 0
  const p = priceBreakdown(price || 0, rate, calc, 0)

  // A prepared item's cost always follows its components.
  useEffect(() => {
    if (rules.costIsComputed) setValue("costPrice", Math.round(computedCost * 100) / 100)
  }, [rules.costIsComputed, computedCost, setValue])
  // Changing to a tax that has no exemption clears a stale reason.
  useEffect(() => {
    if (!zeroRate && getValues("taxExemptionReasonId") != null) setValue("taxExemptionReasonId", null)
  }, [zeroRate, getValues, setValue])

  return (
    <>
      <FormInput control={control} name="costPrice" type="number" label={t("productForm.cost")} placeholder={t("productForm.costHint")}
        disabled={rules.costIsComputed} description={rules.costIsComputed ? t("productForm.autoCost") : undefined} />
      {rules.ownBarcodeAndPrice && <FormInput control={control} name="sellingPrice" type="number" required label={t("productForm.price")} placeholder={t("productForm.priceHint")} />}
      {rules.sells && !exempt && (
        <>
          <FormSelect control={control} name="taxId" numeric required label={t("productForm.tax")} placeholder={t("productForm.pickTax")}
            options={taxes.map((x) => ({ value: String(x.id), label: x.name }))} />
          {!zeroRate && (
            <FormSelect control={control} name="taxCalculation" numeric required label={t("productForm.taxCalc")} placeholder={t("productForm.pickTaxCalc")}
              options={[{ value: "1", label: t("productForm.taxInclusive") }, { value: "2", label: t("productForm.taxExclusive") }]} />
          )}
          {rules.ownBarcodeAndPrice && (
            <div className="lg:col-span-2">
              <div className="w-full rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col space-y-3.5 tabular-nums">
                  <div className="flex items-center justify-between text-[15px] text-muted-foreground"><span>{t("productForm.beforeTax")}</span><span>{formatMoney(p.before)}</span></div>
                  <div className="flex items-center justify-between text-[15px] text-primary"><span>{t("productForm.taxLabel")} ({rate}%) {tax?.name}</span><span>{formatMoney(p.tax)} +</span></div>
                  <div className="my-0.5 border-t border-border" />
                  <div className="flex items-center justify-between pt-1 text-lg font-bold"><span>{t("productForm.finalPrice")}</span><span>{formatMoney(p.after)}</span></div>
                </div>
              </div>
            </div>
          )}
          {zeroRate && (
            <div className="lg:col-span-2">
              <FormSelect control={control} name="taxExemptionReasonId" numeric required label={t("productForm.exemption")} placeholder={t("productForm.pickExemption")}
                options={reasons.filter((r) => r.taxId === taxId).map((r) => ({ value: String(r.id), label: r.taxExemptionReasonText || r.taxExemptionReasonCode || "" }))} />
            </div>
          )}
        </>
      )}
    </>
  )
}

/** Barcode with its generate button, the base unit, and the stock alert; a raw material also has its purchase unit. */
export function BarcodeUnitFields() {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const type = useWatch({ control, name: "type" })
  const { data: units = [] } = useUnits()
  const rules = kindRules(type)
  const unitOptions = units.map((u) => ({ value: String(u.id), label: u.name }))
  return (
    <>
      {rules.ownBarcodeAndPrice && (
        <FormInput control={control} name="barcode" dir="ltr" required label={t("productForm.barcode")} placeholder={t("productForm.barcodeHint")}
          end={<Button type="button" variant="outline" size="icon-lg" aria-label={t("products.generate")} className="shrink-0" onClick={() => setValue("barcode", randomBarcode(), { shouldValidate: true })}><Barcode size={16} /></Button>} />
      )}
      {type !== "Branched" && <FormSelect control={control} name="baseUnitId" numeric required label={t("productForm.unit")} placeholder={t("productForm.pickUnit")} options={unitOptions} />}
      {rules.holdsStock && (
        <div className="lg:col-span-2"><FormInput control={control} name="minStockLevel" type="number" label={t("productForm.minStock")} placeholder={t("productForm.minStockHint")} /></div>
      )}
      {rules.purchaseUnit && (
        <>
          <FormSelect control={control} name="purchaseUnitId" numeric required label={t("products.purchaseUnit")} options={unitOptions} />
          <FormInput control={control} name="purchaseConversionFactor" type="number" required label={t("products.conversionFactor")} description={t("products.conversionHint")} />
        </>
      )}
    </>
  )
}

/** The box of additional sales units: a piece or a carton, each with its base-unit quantity, barcode and price. */
export function ExtraUnitsBox() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const { data: units = [] } = useUnits()
  const rows = useFieldArray({ control, name: "units" })
  const unitOptions = units.map((u) => ({ value: String(u.id), label: u.name }))
  const grid = "md:grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_36px]"
  return (
    <section className="space-y-4 rounded-xl border border-primary/25 bg-primary/[0.025] p-4 lg:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{t("productForm.extraUnits")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("productForm.extraUnitsHelp")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => rows.append({ unitId: 0, conversionFactor: 1, barcode: "", sellingPrice: 0 }, { shouldFocus: false })}><Plus size={16} />{t("productForm.addUnit")}</Button>
      </div>
      {rows.fields.length > 0 && (
        <div className="space-y-3">
          <div className={`hidden gap-3 px-1 text-xs font-medium text-muted-foreground md:grid ${grid}`}>
            <span>{t("productForm.unit")}</span><span>{t("productForm.unitQty")}</span><span>{t("productForm.barcode")}</span><span>{t("productForm.price")}</span><span />
          </div>
          {rows.fields.map((f, i) => (
            <div key={f.id} className={`grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-3 md:border-0 md:bg-transparent md:p-0 ${grid}`}>
              <FormSelect control={control} name={`units.${i}.unitId`} numeric label={t("productForm.unit")} labelHidden placeholder={t("productForm.pickUnit")} options={unitOptions} />
              <FormInput control={control} name={`units.${i}.conversionFactor`} type="number" label={t("productForm.unitQty")} labelHidden />
              <FormInput control={control} name={`units.${i}.barcode`} dir="ltr" label={t("productForm.barcode")} labelHidden placeholder={t("productForm.unitBarcode")} />
              <FormInput control={control} name={`units.${i}.sellingPrice`} type="number" label={t("productForm.price")} labelHidden placeholder={t("productForm.price")} />
              <Button type="button" variant="ghost-destructive" size="icon" aria-label={t("common.remove")} onClick={() => rows.remove(i)}><Trash2 size={16} /></Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/** The preparation-receipt printer, when the branch has printers set up. */
export function PrinterField() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  const options = usePrinterOptions(useWatch({ control, name: "printerName" }))
  return (
    <div className="lg:col-span-2">
      <FormSelect control={control} name="printerName" label={t("productForm.printer")} allowEmpty={t("productForm.noPrinter")} options={options} />
    </div>
  )
}

export function DescriptionField() {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductForm>()
  return <div className="lg:col-span-2"><FormTextarea control={control} name="description" label={t("productForm.description")} placeholder={t("productForm.descriptionHint")} /></div>
}

/** "Show the item on the sales screen", the last box of the form. */
export function ShowInSalesBox() {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ProductForm>()
  const [type, on] = useWatch({ control, name: ["type", "showInSalesScreen"] })
  if (!kindRules(type).sells) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-4 lg:col-span-2">
      <Checkbox id="product-show-in-sales" checked={on} onCheckedChange={(v) => setValue("showInSalesScreen", v === true, { shouldDirty: true })} />
      <label htmlFor="product-show-in-sales" className="cursor-pointer text-sm font-medium">{t("productForm.showInSales")}</label>
    </div>
  )
}
