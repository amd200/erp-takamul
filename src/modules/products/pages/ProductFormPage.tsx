import { useEffect, useMemo } from "react"
import { productFormOf, typeOf } from "../mappers"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useAppSettings } from "@/modules/settings"
import { useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { productsApi } from "../service"
import { ChildrenSection } from "../components/ChildrenSection"
import { ComponentsSection } from "../components/ComponentsSection"
import { ProductTypePicker } from "../components/ProductTypePicker"
import { ImagePanel } from "../components/SidePanels"
import { BarcodeUnitFields, CategoryField, DescriptionField, ExtraUnitsBox, NamesFields, PricingFields, PrinterField, ShowInSalesBox } from "../components/ProductFields"
import { parseProductType, useProduct, useSaveProduct } from "../queries"
import { buildProductSchema, emptyProduct, kindRules, type ProductForm } from "../schema"
import type { ProductType } from "../types"

export default function ProductFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : undefined
  const [search] = useSearchParams()
  const { data: existing, isLoading } = useProduct(editId, parseProductType(search.get("type")))
  const { data: taxes = [] } = useTaxes()
  const { data: units = [] } = useUnits()
  const taxSetting = useAppSettings().taxSetting?.taxSetting
  const save = useSaveProduct()

  const schema = useMemo(
    () => buildProductSchema({ taxExempt: taxSetting === "Exempt", zeroRateTaxIds: taxes.filter((x) => x.amount === 0).map((x) => x.id) }),
    [taxSetting, taxes],
  )
  const form = useForm<ProductForm>({ resolver: zodResolver(schema), defaultValues: emptyProduct() })
  const [type, components, baseUnitId, taxId] = useWatch({ control: form.control, name: ["type", "components", "baseUnitId", "taxId"] })
  const rules = kindRules(type)

  useEffect(() => {
    if (existing) form.reset({ ...emptyProduct(typeOf(existing.productType)), ...productFormOf(existing) })
  }, [existing, form])

  // New items start on the first unit and the first tax the branch has.
  useEffect(() => {
    if (editId) return
    if (!baseUnitId && units[0]) form.setValue("baseUnitId", units[0].id)
    if (!taxId && taxes[0]) form.setValue("taxId", taxes[0].id)
  }, [editId, units, taxes, baseUnitId, taxId, form])

  // The server prices the recipe: it knows each material's unit costs.
  const valid = components.filter((c) => c.productId && c.unitId && c.quantity > 0)
  const { data: serverCost } = useQuery({
    queryKey: ["products", "prepared-cost", valid],
    queryFn: () => productsApi.preparedCost(valid),
    enabled: rules.components && valid.length > 0,
    placeholderData: keepPreviousData,
  })
  const computedCost = valid.length ? serverCost ?? 0 : 0

  const changeType = (next: ProductType) => {
    const keep = form.getValues()
    form.reset({ ...emptyProduct(next), nameAr: keep.nameAr, nameEn: keep.nameEn, categoryId: keep.categoryId, description: keep.description })
  }

  const submit = form.handleSubmit((data) => {
    save.mutate({ id: editId, data: { ...data, calories: data.calories ?? null }, opts: { exempt: taxSetting === "Exempt" } }, { onSuccess: () => nav("/products") })
  })

  if (editId && isLoading) {
    return <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
  }

  const hasErrors = form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
        <div className="rounded-lg border border-gray-200 p-6 dark:border-zinc-800">
          <div className="mb-6">
            <h1 className="text-2xl leading-snug font-bold">{editId ? t("productForm.editTitle") : t("productForm.addTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("productForm.addSubtitle")}</p>
          </div>
          <div className="mb-8"><ProductTypePicker value={type} onChange={changeType} locked={!!editId} /></div>

          {/* One two-column grid, in the order of the current system's form. */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <NamesFields />
            {type !== "RawMatrial" && <CategoryField />}
            {type === "Direct" && <><PricingFields computedCost={computedCost} /><BarcodeUnitFields /><ExtraUnitsBox /><PrinterField /><DescriptionField /><ImagePanel /><ShowInSalesBox /></>}
            {type === "Branched" && <><DescriptionField />{rules.children && <div className="lg:col-span-2"><ChildrenSection selfId={editId} /></div>}<ImagePanel /></>}
            {type === "Prepared" && <><PricingFields computedCost={computedCost} /><BarcodeUnitFields /><DescriptionField />{rules.components && <div className="lg:col-span-2"><ComponentsSection computedCost={computedCost} /></div>}<ImagePanel /></>}
            {type === "RawMatrial" && <><PricingFields computedCost={computedCost} /><DescriptionField /><BarcodeUnitFields /></>}
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-lg border px-3 py-4 lg:flex-row lg:items-center">
          <Button asChild variant="destructive" size="xl"><Link to="/products">{t("common.cancel")}</Link></Button>
          <span className="text-sm text-destructive" role="status">{hasErrors ? t("products.fixErrors") : ""}</span>
          <Button type="submit" size="xl" disabled={save.isPending}>{t("productForm.save")}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
