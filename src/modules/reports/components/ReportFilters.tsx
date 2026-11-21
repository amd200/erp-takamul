import { useTranslation } from "react-i18next"
import { fullName } from "@/modules/lookups/types"
import { Field, FieldLabel } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCategories } from "@/modules/categories/queries"
import { useCustomers, useEmployees, useSuppliers } from "@/modules/lookups/service"
import { Button } from "@/components/ui/button"
import { ProductSearchPicker } from "@/modules/products/components/ProductSearchPicker"
import { useProductsByIds } from "@/modules/products/lookup"
import { daysAgo } from "../dataset"
import type { FilterKey, Filters } from "../types"

export const PRESETS = ["today", "last7", "thisMonth", "lastMonth", "last45"] as const
export type Preset = (typeof PRESETS)[number] | "custom"

export function presetRange(p: Exclude<Preset, "custom">): { from: string; to: string } {
  const now = new Date()
  const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
  switch (p) {
    case "today": return { from: daysAgo(0), to: daysAgo(0) }
    case "last7": return { from: daysAgo(6), to: daysAgo(0) }
    case "thisMonth": return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: daysAgo(0) }
    case "lastMonth": return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) }
    case "last45": return { from: daysAgo(44), to: daysAgo(0) }
  }
}

const ALL = "all"

/** One row of filters above the report; changing any of them re-runs it. */
export function ReportFilters({ keys, required, value, preset, onChange, onPreset }: {
  keys: FilterKey[]
  required: string[]
  value: Filters
  preset: Preset
  onChange: (f: Filters) => void
  onPreset: (p: Preset) => void
}) {
  const { t } = useTranslation()
  // The chosen item's name is read by id; the others are searched on the server when the list opens.
  const { map: chosenProduct } = useProductsByIds(value.productId ? [value.productId] : [])
  const { data: customers = [] } = useCustomers()
  const { data: suppliers = [] } = useSuppliers()
  const { data: employees = [] } = useEmployees()
  const { data: categories = [] } = useCategories()

  const entity = (key: "customerId" | "supplierId" | "employeeId" | "categoryId", label: string, options: { id: number; name: string }[], isRequired: boolean) => (
    <Field className="w-full sm:w-56">
      <FieldLabel htmlFor={key}>{label}{isRequired && <span className="text-destructive">*</span>}</FieldLabel>
      <Select value={value[key] ? String(value[key]) : isRequired ? "" : ALL} onValueChange={(v) => onChange({ ...value, [key]: v === ALL ? undefined : Number(v) })}>
        <SelectTrigger id={key} className="h-10 w-full"><SelectValue placeholder={t("reports.pick")} /></SelectTrigger>
        <SelectContent>
          {!isRequired && <SelectItem value={ALL}>{t("reports.all")}</SelectItem>}
          {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )

  const productFilter = (isRequired: boolean) => (
    <Field className="w-full sm:w-56">
      <FieldLabel htmlFor="productId">{t("products.item")}{isRequired && <span className="text-destructive">*</span>}</FieldLabel>
      <div className="flex gap-1">
        <ProductSearchPicker accept={(p) => p.productType !== "Branched"} onPick={(p) => onChange({ ...value, productId: p.id })}>
          <Button id="productId" type="button" variant="outline" className="h-10 min-w-0 flex-1 justify-start font-normal">
            <span className="truncate">{value.productId ? chosenProduct.get(value.productId)?.productNameAr ?? t("common.loading") : isRequired ? t("reports.pick") : t("reports.all")}</span>
          </Button>
        </ProductSearchPicker>
        {!isRequired && value.productId && <Button type="button" variant="ghost" size="icon" className="size-10" aria-label={t("reports.all")} onClick={() => onChange({ ...value, productId: undefined })}>×</Button>}
      </div>
    </Field>
  )

  return (
    <div className="flex flex-wrap items-end gap-3 print:hidden">
      {keys.includes("period") && (
        <>
          <Field className="w-auto">
            <FieldLabel>{t("reports.period")}</FieldLabel>
            <ToggleGroup type="single" variant="outline" value={preset} onValueChange={(p) => p && onPreset(p as Preset)} className="flex-wrap">
              {PRESETS.map((p) => (
                <ToggleGroupItem key={p} value={p} className="h-10 px-3 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">{t(`reports.presets.${p}`)}</ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <div className="flex items-end gap-1.5">
            <Field className="w-36"><FieldLabel htmlFor="from">{t("sales.from")}</FieldLabel>
              <DatePicker id="from" value={value.from} max={value.to} onChange={(v) => { onPreset("custom"); onChange({ ...value, from: v }) }} /></Field>
            <Field className="w-36"><FieldLabel htmlFor="to">{t("sales.to")}</FieldLabel>
              <DatePicker id="to" value={value.to} min={value.from} onChange={(v) => { onPreset("custom"); onChange({ ...value, to: v }) }} /></Field>
          </div>
        </>
      )}
      {keys.includes("product") && productFilter(required.includes("product"))}
      {keys.includes("customer") && entity("customerId", t("sales.customer"), customers.map((c) => ({ id: c.id, name: c.customerName })), required.includes("customer"))}
      {keys.includes("supplier") && entity("supplierId", t("reports.supplier"), suppliers.map((x) => ({ id: x.id, name: x.supplierName })), required.includes("supplier"))}
      {keys.includes("employee") && entity("employeeId", t("sales.employee"), employees.map((e) => ({ id: e.id, name: fullName(e) })), false)}
      {keys.includes("category") && entity("categoryId", t("products.category"), categories.filter((c) => c.parentCategoryId == null).map((c) => ({ id: c.id, name: c.categoryNameAr })), false)}
      {keys.includes("top") && (
        <Field className="w-32">
          <FieldLabel htmlFor="top">{t("reports.top")}</FieldLabel>
          <Select value={String(value.top ?? 10)} onValueChange={(v) => onChange({ ...value, top: Number(v) })}>
            <SelectTrigger id="top" className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 10, 20].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
    </div>
  )
}
