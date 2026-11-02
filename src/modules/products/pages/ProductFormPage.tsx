import { useEffect, useMemo } from "react"
import { productFormOf, typeOf } from "../mappers"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useAppSettings } from "@/modules/settings"
import { useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { productsApi } from "../service"
import { BasicInfoSection } from "../components/modern/BasicInfoSection"
import { ComponentsSection as ModernComponents } from "../components/modern/ComponentsSection"
import { ChildrenSection as ModernChildren } from "../components/modern/ChildrenSection"
import { PricingSection } from "../components/modern/PricingSection"
import { StockUnitsSection } from "../components/modern/StockUnitsSection"
import { ProductTypePicker as ModernTypePicker } from "../components/modern/ProductTypePicker"
import { ImagePanel as SideImagePanel, OptionsPanel, PriceSummary } from "../components/modern/SidePanels"
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
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <PageHeader crumbs={[t("nav.items"), editId ? t("common.edit") : t("common.add")]}
            title={editId ? t("products.editTitle", { name: existing?.productNameAr }) : t("products.addTitle")} />

          <SectionCard title={t("products.type")} description={editId ? t("products.typeLocked") : t("products.typePick")}>
            <ModernTypePicker value={type} onChange={changeType} locked={!!editId} />
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-5">
              <BasicInfoSection />
              {rules.components && <ModernComponents computedCost={computedCost} />}
              {rules.children && <ModernChildren selfId={editId} />}
              <PricingSection computedCost={computedCost} />
              <StockUnitsSection />
            </div>
            <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
              {rules.ownBarcodeAndPrice && <PriceSummary />}
              {rules.sells && <SideImagePanel />}
              <OptionsPanel />
            </aside>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <span className="text-sm text-destructive" role="status">{hasErrors ? t("products.fixErrors") : ""}</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="lg"><Link to="/products">{t("common.cancel")}</Link></Button>
              <Button type="submit" size="lg" disabled={save.isPending}>{editId ? t("common.saveChanges") : t("products.save")}</Button>
            </div>
          </div>
        </form>
      </FormProvider>
    )
}

