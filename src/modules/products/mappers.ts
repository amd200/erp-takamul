import { toFormData } from "@/shared/http/paged"
import type { Product, ProductInput, ProductType, TaxCalculation } from "./types"

/**
 * Server tax calculation: 2 / "Includestax" = price includes tax, 3 / "Excludestax" = tax on top.
 */
const TYPES: ProductType[] = ["Direct", "Prepared", "Branched", "RawMatrial"]
// The server sends enum names (JsonStringEnumConverter); a number would be the C# position.
export const typeOf = (v: unknown): ProductType => (typeof v === "number" ? TYPES[v] ?? "Direct" : TYPES.find((t) => t.toLowerCase() === String(v).toLowerCase()) ?? "Direct")
const toCalc = (v: unknown): TaxCalculation => (v === 3 || v === "3" || String(v).toLowerCase() === "excludestax" ? 2 : 1)
export const calcToServer = (c: TaxCalculation) => (c === 1 ? 2 : 3)
const num = (v: number | null | undefined, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d)

/** The price as it is entered and sold: with tax when the item is priced with tax, otherwise before it. */
export const enteredPrice = (d: Pick<Product, "taxCalculation" | "priceAfterTax" | "priceBeforeTax" | "sellingPrice">) =>
  num(toCalc(d.taxCalculation) === 1 ? d.priceAfterTax ?? d.sellingPrice : d.priceBeforeTax ?? d.sellingPrice)
/**
 * The price when the branch is tax-exempt: an item that carries tax is sold without it (the server uses the price before tax and adds none).
 * `u` is a sale unit's own prices, when the item is sold in one.
 */
export const priceBeforeTaxOf = (d: Pick<Product, "priceBeforeTax" | "sellingPrice">, u?: { priceBeforeTax?: number | null; sellingPrice?: number | null }) =>
  num(u ? u.priceBeforeTax ?? u.sellingPrice : d.priceBeforeTax ?? d.sellingPrice)
/** The price a card or search result shows: before tax in an exempt branch, otherwise with tax. */
export const listedPrice = (d: Pick<Product, "priceBeforeTax" | "priceAfterTax" | "sellingPrice">, exempt: boolean) =>
  exempt ? priceBeforeTaxOf(d) : num(d.priceAfterTax ?? d.sellingPrice)
/** 1 = the price includes tax, 2 = tax is added on top. */
export const taxCalcOf = (d: Pick<Product, "taxCalculation">): TaxCalculation => toCalc(d.taxCalculation)
/** Items shown on the sales screen: switched on, and never raw materials unless the server says so. */
export const showsInSales = (d: Pick<Product, "isActive" | "showInSalesScreen" | "productType">) => d.isActive !== false && (d.showInSalesScreen ?? d.productType !== "RawMatrial")

/** What the product form starts with when a saved item is opened. The form edits the price the way it was entered (with or without tax). */
export function productFormOf(d: Product): ProductInput {
  const type = typeOf(d.productType)
  const calc = toCalc(d.taxCalculation)
  return {
    type,
    nameAr: d.productNameAr ?? "",
    nameEn: d.productNameEn ?? "",
    nameUr: d.productNameUr ?? "",
    description: d.description ?? "",
    barcode: d.barcode ?? "",
    categoryId: d.categoryId ?? null,
    baseUnitId: num(type === "Branched" ? d.baseUnit : d.baseUnitId),
    costPrice: num(d.costPrice),
    sellingPrice: type === "RawMatrial" || type === "Branched" ? 0 : enteredPrice(d),
    taxId: num(d.taxId),
    taxCalculation: calc,
    taxExemptionReasonId: d.taxExemptionReasonId ?? null,
    minStockLevel: num(d.minStockLevel),
    isActive: d.isActive ?? true,
    showInSalesScreen: type === "RawMatrial" ? false : d.showInSalesScreen ?? true,
    printerName: d.printerName || null,
    displayOrder: num(d.displayOrder),
    calories: d.calories ?? null,
    units: (d.units ?? []).filter((u) => !u.isBaseUnit).map((u) => ({ id: u.id, unitId: u.unitId, conversionFactor: num(u.conversionFactor, 1), barcode: u.barcode ?? "", sellingPrice: num(u.sellingPrice) })),
    components: (d.components ?? []).map((c) => ({ productId: c.componentProductId, unitId: c.unitId, quantity: c.quantity, name: c.componentNameAr ?? "" })),
    children: (d.children ?? []).map((c) => ({ id: c.id, nameAr: c.productNameAr, barcode: c.barcode ?? "", sellingPrice: num(c.sellingPrice) })),
    purchaseUnitId: d.purchaseUnitId ?? null,
    purchaseConversionFactor: d.conversionFactor ?? null,
    image: d.imageUrl || null,
  }
}

/** Image: a new file is uploaded; on edit, keeping the old one sends its URL as ImageUrl. */
const imageFields = (image: ProductInput["image"], editing: boolean) =>
  image instanceof File ? { Image: image } : editing && typeof image === "string" && image ? { ImageUrl: image } : {}

const taxFields = (p: ProductInput) =>
  ({ TaxId: p.taxId || undefined, TaxCalculation: calcToServer(p.taxCalculation), TaxExemptionReasonId: p.taxExemptionReasonId ?? undefined })

const common = (p: ProductInput) => ({
  ProductNameAr: p.nameAr, ProductNameEn: p.nameEn, ProductNameUr: p.nameUr, Description: p.description, CategoryId: p.categoryId,
  PrinterName: p.printerName, DisplayOrder: p.displayOrder, Calories: p.calories,
})

export function toDirectForm(p: ProductInput, { editing, branchId }: { editing: boolean; branchId?: number | null }) {
  return toFormData({
    ...(editing ? {} : { BranchId: branchId }),
    ...common(p), Barcode: p.barcode, BaseUnitId: p.baseUnitId, CostPrice: p.costPrice, SellingPrice: p.sellingPrice,
    MinStockLevel: p.minStockLevel, ShowInSalesScreen: p.showInSalesScreen, ...taxFields(p), ...imageFields(p.image, editing),
    // Units travel as one JSON field; the server also accepts Units[0].UnitId style, but JSON is simpler.
    Units: JSON.stringify(p.units.map((u) => ({ ...(u.id ? { id: u.id } : {}), unitId: u.unitId, isBaseUnit: false, conversionFactor: u.conversionFactor, barcode: u.barcode, sellingPrice: u.sellingPrice }))),
  })
}

export function toPreparedForm(p: ProductInput, { editing, branchId }: { editing: boolean; branchId?: number | null }) {
  return toFormData({
    ...(editing ? {} : { BranchId: branchId }),
    ...common(p), Barcode: p.barcode, BaseUnitId: p.baseUnitId, SellingPrice: p.sellingPrice, ShowInSalesScreen: p.showInSalesScreen,
    ...taxFields(p), ...imageFields(p.image, editing),
    Components: JSON.stringify(p.components.map((c) => ({ componentProductId: c.productId, unitId: c.unitId, quantity: c.quantity }))),
  })
}

export function toBranchedForm(p: ProductInput, { editing, branchId }: { editing: boolean; branchId?: number | null }) {
  return toFormData({
    ...(editing ? {} : { BranchId: branchId }),
    ...common(p), ChildrenIds: p.children.map((c) => c.id), ...imageFields(p.image, editing),
  })
}

export const toRawJson = (p: ProductInput, branchId?: number | null) => ({
  ...(branchId ? { branchId } : {}),
  productNameAr: p.nameAr, productNameEn: p.nameEn || null, productNameUr: p.nameUr || null, costPrice: p.costPrice, baseUnitId: p.baseUnitId || null,
  purchaseUnitId: p.purchaseUnitId, conversionFactor: p.purchaseConversionFactor, displayOrder: p.displayOrder, calories: p.calories,
})
