import { useEffect, useRef } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { useTaxes } from "@/modules/taxes/service"
import { useUnits } from "@/modules/units/queries"
import { productsApi } from "../service"
import { BranchSection } from "@/modules/branches/BranchSection"
import { BasicInfoSection } from "../components/modern/BasicInfoSection"
import { ComponentsSection as ModernComponents } from "../components/modern/ComponentsSection"
import { ChildrenSection as ModernChildren } from "../components/modern/ChildrenSection"
import { PricingSection } from "../components/modern/PricingSection"
import { StockUnitsSection } from "../components/modern/StockUnitsSection"
import { ProductTypePicker as ModernTypePicker } from "../components/modern/ProductTypePicker"
import { ImagePanel as SideImagePanel, OptionsPanel, PriceSummary } from "../components/modern/SidePanels"
import { parseProductType, useProduct, useSaveProduct } from "../queries"
import { emptyProduct, kindRules, productFormOf, productSchema, type ProductForm } from "../schema"
import type { ProductType } from "../types"
import { productKeys } from "../keys"

export default function ProductFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : undefined
  const [search] = useSearchParams()
  const formBranch = useFormBranch(!editId)
  const { data: existing, isLoading } = useProduct(editId, parseProductType(search.get("type")))
  const { data: taxes = [] } = useTaxes()
  const { data: units = [] } = useUnits()
  const save = useSaveProduct()

  const form = useForm<ProductForm>({ resolver: zodResolver(productSchema), defaultValues: emptyProduct() })
  const [type, components, baseUnitId, taxId] = useWatch({ control: form.control, name: ["productType", "components", "baseUnitId", "taxId"] })
  const rules = kindRules(type)

  useEffect(() => {
    if (existing) form.reset({ ...emptyProduct(existing.productType ?? "Direct"), ...productFormOf(existing) })
  }, [existing, form])

  // New items start on the first unit and the first tax the branch has.
  useEffect(() => {
    if (editId) return
    if (!baseUnitId && units[0]) form.setValue("baseUnitId", units[0].id)
    if (!taxId && taxes[0]) form.setValue("taxId", taxes[0].id)
  }, [editId, units, taxes, baseUnitId, taxId, form])

  // The server prices the recipe: it knows each material's unit costs.
  const valid = components.filter((c) => c.componentProductId && c.unitId && c.quantity > 0)
  const { data: serverCost } = useQuery({
    queryKey: productKeys.preparedCost(valid),
    queryFn: () => productsApi.preparedCost(valid),
    enabled: rules.components && valid.length > 0,
    placeholderData: keepPreviousData,
  })
  const computedCost = valid.length ? serverCost ?? 0 : 0

  // The lists belong to the branch (picked here or moved by the header), so what was picked from the old branch's lists is cleared; names, prices and image stay.
  const lastBranch = useRef(formBranch.branchId)
  useEffect(() => {
    if (lastBranch.current === formBranch.branchId) return
    lastBranch.current = formBranch.branchId
    const empty = emptyProduct(form.getValues("productType"))
    for (const k of ["categoryId", "baseUnitId", "taxId", "taxExemptionReasonId", "purchaseUnitId", "units", "components", "children"] as const) form.setValue(k, empty[k] as never)
  }, [formBranch.branchId, form])

  const changeType = (next: ProductType) => {
    const keep = form.getValues()
    form.reset({ ...emptyProduct(next), productNameAr: keep.productNameAr, productNameEn: keep.productNameEn, categoryId: keep.categoryId, description: keep.description })
  }

  // Tax rules: a tax is required, and a 0% tax needs an exemption reason.
  const checkTax = (data: ProductForm) => {
    if (!kindRules(data.productType).sells) return true
    if (!data.taxId) form.setError("taxId", { message: "validation.taxRequired" })
    else if (taxes.find((x) => x.id === data.taxId)?.amount === 0 && !data.taxExemptionReasonId) form.setError("taxExemptionReasonId", { message: "validation.exemptionRequired" })
    else return true
    return false
  }

  const submit = form.handleSubmit(
    (data) => {
      if (!checkTax(data)) return
      save.mutate({ id: editId, data: { ...data, calories: data.calories ?? null } }, { onSuccess: () => nav("/products") })
    },
    () => { checkTax(form.getValues()) },
  )

  if (editId && isLoading) {
    return <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
  }

  const hasErrors = form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0

  return (
      <FormProvider {...form}>
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <PageHeader
            title={editId ? t("products.editTitle", { name: existing?.productNameAr }) : t("products.addTitle")} />

          <SectionCard title={t("products.type")} description={editId ? t("products.typeLocked") : t("products.typePick")}>
            <ModernTypePicker value={type} onChange={changeType} locked={!!editId} />
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-5">
              <BasicInfoSection branchField={formBranch.show ? <BranchSection className="sm:col-span-2" value={formBranch.branchId} onChange={formBranch.pick} hint={t("products.branchHint")} /> : undefined} />
              {rules.components && <ModernComponents computedCost={computedCost} />}
              {rules.children && <ModernChildren selfId={editId} />}
              {/* A branched item has no price, tax, unit or stock of its own; they belong to its children. */}
              {rules.children || (
                <>
                  <PricingSection computedCost={computedCost} />
                  <StockUnitsSection />
                </>
              )}
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

