import { z } from "zod"
import { PRODUCT_TYPES, type ProductType } from "./types"

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
  productId: num("validation.rawRequired").min(1, "validation.rawRequired"),
  unitId: num("validation.unitRequired").min(1, "validation.unitRequired"),
  quantity: num().positive("validation.qtyPositive"),
  name: z.string().optional(),
})

/** A branched item's children are existing items, picked from the list. */
const child = z.object({ id: z.number(), nameAr: z.string(), barcode: z.string(), sellingPrice: z.number() })

const productObject = z.object({
  type: z.enum(PRODUCT_TYPES),
  nameAr: z.string().trim().min(1, "validation.nameArRequired"),
  nameEn: z.string().trim(),
  nameUr: z.string().trim(),
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
  purchaseConversionFactor: z.number().nullable(),
  /** A new file to upload, or the current image URL to keep it. */
  image: z.union([z.instanceof(File), z.string()]).nullable(),
})

export type ProductForm = z.infer<typeof productObject>

/** Which sections and rules apply to each kind. */
export const kindRules = (type: ProductType) => ({
  sells: type !== "RawMatrial",
  ownBarcodeAndPrice: type === "Direct" || type === "Prepared",
  holdsStock: type === "Direct" || type === "RawMatrial",
  extraUnits: type === "Direct",
  components: type === "Prepared",
  children: type === "Branched",
  purchaseUnit: type === "RawMatrial",
  costIsComputed: type === "Prepared",
})

/**
 * Rules that depend on the item kind and the branch tax settings, mirroring the current system:
 * a 0% tax needs an exemption reason in tax stages 1 and 2; "Exempt" branches skip tax entirely.
 */
export function buildProductSchema(opts: { taxExempt: boolean; zeroRateTaxIds: number[] }) {
  return productObject.superRefine((v, ctx) => {
    const r = kindRules(v.type)
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message })

    if (!v.categoryId && v.type !== "RawMatrial") issue(["categoryId"], "validation.categoryRequired")
    if (!v.baseUnitId && v.type !== "Branched") issue(["baseUnitId"], "validation.unitRequired")
    if (r.ownBarcodeAndPrice) {
      if (!v.barcode) issue(["barcode"], "validation.barcodeRequired")
      if (!(v.sellingPrice > 0)) issue(["sellingPrice"], "validation.pricePositive")
    }
    if (!opts.taxExempt && r.sells) {
      if (!v.taxId) issue(["taxId"], "validation.taxRequired")
      else if (opts.zeroRateTaxIds.includes(v.taxId) && !v.taxExemptionReasonId) issue(["taxExemptionReasonId"], "validation.exemptionRequired")
    }
    if (r.components && v.components.length === 0) issue(["components"], "validation.componentsRequired")
    if (r.children && v.children.length === 0) issue(["children"], "validation.childrenRequired")
    if (r.purchaseUnit) {
      if (!v.purchaseUnitId) issue(["purchaseUnitId"], "validation.unitRequired")
      if (!(Number(v.purchaseConversionFactor) > 0)) issue(["purchaseConversionFactor"], "validation.factorPositive")
    }
  })
}

export const emptyProduct = (type: ProductType = "Direct", defaults?: { baseUnitId?: number; taxId?: number }): ProductForm => ({
  type, nameAr: "", nameEn: "", nameUr: "", description: "", barcode: "", categoryId: null, baseUnitId: defaults?.baseUnitId ?? 0,
  costPrice: 0, sellingPrice: 0, taxId: defaults?.taxId ?? 0, taxCalculation: 1, taxExemptionReasonId: null, minStockLevel: 1,
  isActive: true, showInSalesScreen: type !== "RawMatrial", printerName: null, displayOrder: 0, calories: null,
  units: [], components: [], children: [], purchaseUnitId: null, purchaseConversionFactor: null, image: null,
})
