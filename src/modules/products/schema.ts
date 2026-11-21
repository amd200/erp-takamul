import { z } from "zod"
import { PRODUCT_TYPES, type Product, type ProductType } from "./types"
import { enteredPrice, numOr, taxCalcOf } from "./pricing"

/** Messages are i18n keys; FormFields translates them. */
const num = (msg = "validation.number") => z.number({ error: msg })

const saleUnit = z.object({
  id: z.number().optional(),
  unitId: num("validation.unitRequired").min(1, "validation.unitRequired"),
  conversionFactor: num().positive("validation.factorPositive"),
  barcode: z.string().trim().min(1, "validation.barcodeRequired"),
  sellingPrice: num().positive("validation.pricePositive"),
})

const component = z.object({
  componentProductId: num("validation.rawRequired").min(1, "validation.rawRequired"),
  unitId: num("validation.unitRequired").min(1, "validation.unitRequired"),
  quantity: num().positive("validation.qtyPositive"),
  componentNameAr: z.string().optional(),
})

/** A branched item's children are existing items, picked from the list. */
const child = z.object({ id: z.number(), productNameAr: z.string(), barcode: z.string(), sellingPrice: z.number() })

const productShape = z.object({
  productType: z.enum(PRODUCT_TYPES),
  productNameAr: z.string().trim().min(1, "validation.nameArRequired"),
  productNameEn: z.string().trim(),
  productNameUr: z.string().trim(),
  description: z.string(),
  barcode: z.string().trim(),
  categoryId: z.number().nullable(),
  baseUnitId: num("validation.unitRequired").min(0),
  costPrice: num().min(0, "validation.min0"),
  sellingPrice: num().min(0, "validation.min0"),
  taxId: num("validation.taxRequired"),
  taxCalculation: z.union([z.literal(1), z.literal(2)]),
  taxExemptionReasonId: z.number().nullable(),
  minStockLevel: num().min(0, "validation.min0"),
  isActive: z.boolean(),
  showInSalesScreen: z.boolean(),
  printerName: z.string().nullable(),
  displayOrder: num().int("validation.wholeNumber").min(0, "validation.min0"),
  calories: z.number().int("validation.wholeNumber").min(0, "validation.min0").nullish(),
  units: z.array(saleUnit),
  components: z.array(component),
  children: z.array(child),
  purchaseUnitId: z.number().nullable(),
  conversionFactor: z.number().nullable(),
  /** A new file to upload, or the current image URL to keep it. */
  image: z.union([z.instanceof(File), z.string()]).nullable(),
})

export type ProductForm = z.infer<typeof productShape>

/** Which sections and rules apply to each kind. */
export const kindRules = (type: ProductType) => ({
  sells: type !== "RawMatrial",
  ownBarcodeAndPrice: type === "Direct" || type === "Prepared",
  holdsStock: type === "Direct" || type === "RawMatrial",
  extraUnits: type === "Direct",
  components: type === "Prepared",
  children: type === "Branched",
  purchaseUnit: type === "RawMatrial",
  /** A prepared item has no stock or purchase unit, so its base unit (the selling unit) sits in the basic data card. */
  unitInBasic: type === "Prepared",
  costIsComputed: type === "Prepared",
})

/** Rules that depend on the item kind. Tax rules need branch settings, so the form checks them. */
export const productSchema = productShape.superRefine((v, ctx) => {
  const r = kindRules(v.productType)
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message })

  if (!v.categoryId && v.productType !== "RawMatrial") issue(["categoryId"], "validation.categoryRequired")
  if (!v.baseUnitId && v.productType !== "Branched") issue(["baseUnitId"], "validation.unitRequired")
  if (r.ownBarcodeAndPrice) {
    if (!v.barcode) issue(["barcode"], "validation.barcodeRequired")
    if (!(v.sellingPrice > 0)) issue(["sellingPrice"], "validation.pricePositive")
  }
  if (r.components && v.components.length === 0) issue(["components"], "validation.componentsRequired")
  if (r.children && v.children.length === 0) issue(["children"], "validation.childrenRequired")
  if (r.purchaseUnit) {
    if (!v.purchaseUnitId) issue(["purchaseUnitId"], "validation.unitRequired")
    if (!(Number(v.conversionFactor) > 0)) issue(["conversionFactor"], "validation.factorPositive")
  }
})

export const emptyProduct = (type: ProductType = "Direct"): ProductForm => ({
  productType: type, productNameAr: "", productNameEn: "", productNameUr: "", description: "", barcode: "", categoryId: null, baseUnitId: 0,
  costPrice: 0, sellingPrice: 0, taxId: 0, taxCalculation: 1, taxExemptionReasonId: null, minStockLevel: 1,
  isActive: true, showInSalesScreen: type !== "RawMatrial", printerName: null, displayOrder: 0, calories: null,
  units: [], components: [], children: [], purchaseUnitId: null, conversionFactor: null, image: null,
})

/** What the product form starts with when a saved item is opened. The form edits the price the way it was entered (with or without tax). */
export function productFormOf(d: Product): ProductForm {
  const type = d.productType ?? "Direct"
  const calc = taxCalcOf(d)
  return {
    productType: type,
    productNameAr: d.productNameAr ?? "",
    productNameEn: d.productNameEn ?? "",
    productNameUr: d.productNameUr ?? "",
    description: d.description ?? "",
    barcode: d.barcode ?? "",
    categoryId: d.categoryId ?? null,
    baseUnitId: numOr(d.baseUnitId),
    costPrice: numOr(d.costPrice),
    sellingPrice: type === "RawMatrial" || type === "Branched" ? 0 : enteredPrice(d),
    taxId: numOr(d.taxId),
    taxCalculation: calc,
    taxExemptionReasonId: d.taxExemptionReasonId ?? null,
    minStockLevel: numOr(d.minStockLevel),
    isActive: d.isActive ?? true,
    showInSalesScreen: type === "RawMatrial" ? false : d.showInSalesScreen ?? true,
    printerName: d.printerName || null,
    displayOrder: numOr(d.displayOrder),
    calories: d.calories ?? null,
    units: (d.units ?? []).filter((u) => !u.isBaseUnit).map((u) => ({ id: u.id, unitId: u.unitId, conversionFactor: numOr(u.conversionFactor, 1), barcode: u.barcode ?? "", sellingPrice: numOr(u.sellingPrice) })),
    components: (d.components ?? []).map((c) => ({ componentProductId: c.componentProductId, unitId: c.unitId, quantity: c.quantity, componentNameAr: c.componentNameAr ?? "" })),
    children: (d.children ?? []).map((c) => ({ id: c.id, productNameAr: c.productNameAr, barcode: c.barcode ?? "", sellingPrice: numOr(c.sellingPrice) })),
    purchaseUnitId: d.purchaseUnitId ?? null,
    conversionFactor: d.conversionFactor ?? null,
    image: d.imageUrl || null,
  }
}
