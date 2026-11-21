/**
 * Shapes the server sends for items (see ProductsController). `taxCalculation` is a number there; `productType` an enum name.
 */
import type { ProductType } from "./types"

export type UnitDto = {
  id?: number; unitId: number; unitName?: string | null; conversionFactor: number; isBaseUnit?: boolean
  barcode?: string | null; sellingPrice?: number | null; costPrice?: number | null; priceBeforeTax?: number | null; priceAfterTax?: number | null
}

type Common = {
  id: number
  productCode?: number | null
  branchId?: number | null
  productNameAr: string
  productNameEn?: string | null
  productNameUr?: string | null
  description?: string | null
  categoryId?: number | null
  categoryName?: string | null
  displayOrder?: number | null
  calories?: number | null
  isActive?: boolean | null
  balance?: number | null
  imageUrl?: string | null
  printerName?: string | null
  baseUnitId?: number | null
}

/** GET /Products and GET /Products/{id}. */
export type ProductDto = Common & {
  barcode?: string | null
  productType?: ProductType | null
  sellingPrice?: number | null
  costPrice?: number | null
  priceBeforeTax?: number | null
  priceAfterTax?: number | null
  taxId?: number | null
  taxCalculation?: number | null
  taxExemptionReasonId?: number | null
  taxPercentage?: number | null
  /** Set on the items a branched item groups. */
  parentProductId?: number | null
  minStockLevel?: number | null
  baseUnitId?: number | null
  showInSalesScreen?: boolean | null
  units?: UnitDto[] | null
}

export type DirectProductDto = ProductDto
export type PreparedProductDto = ProductDto & {
  components?: { componentProductId: number; componentNameAr?: string; quantity: number; unitId: number }[] | null
}
export type RawMaterialDto = Common & {
  costPrice?: number | null; baseUnitId?: number | null; purchaseUnitId?: number | null; conversionFactor?: number | null; minStockLevel?: number | null
}
export type BranchedProductDto = Common & {
  children?: { id: number; productCode?: number; productNameAr: string; productNameEn?: string | null; barcode?: string | null; costPrice?: number | null; sellingPrice?: number | null }[] | null
}

export type ImportResultDto = {
  totalRows: number; successCount: number; updatedCount: number; failedCount: number
  errors: { rowNumber: number; productName?: string | null; reason: string }[]
}
