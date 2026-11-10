import type { BranchedProductDto, PreparedProductDto, ProductDto, RawMaterialDto } from "./dto"

/** The four item kinds the backend supports, with their endpoint suffix. */
export const PRODUCT_TYPES = ["Direct", "Branched", "Prepared", "RawMatrial"] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

/** 1 = the entered price includes tax, 2 = tax is added on top. The form converts to the server's values (2 / 3). */
export type TaxCalculation = 1 | 2

/** `id` is the existing unit row when editing; the server needs it to update instead of adding. */
export type SaleUnit = { id?: number; unitId: number; conversionFactor: number; barcode: string; sellingPrice: number }
/** `name` is the material's name as the server sends it with the recipe; the form only shows it. */
export type Component = { productId: number; unitId: number; quantity: number; name?: string }
/** A branched item groups existing items; these are the chosen ones. */
export type BranchChild = { id: number; nameAr: string; barcode: string; sellingPrice: number }

/** What the product form holds. */
type ProductFields = {
  id: number
  code: number
  type: ProductType
  nameAr: string
  nameEn: string
  nameUr: string
  description: string
  barcode: string
  categoryId: number | null
  categoryName: string
  baseUnitId: number
  costPrice: number
  sellingPrice: number
  taxId: number
  taxCalculation: TaxCalculation
  taxExemptionReasonId: number | null
  minStockLevel: number
  /** null for kinds that do not hold stock themselves (prepared, branched). */
  balance: number | null
  isActive: boolean
  showInSalesScreen: boolean
  printerName: string | null
  displayOrder: number
  calories: number | null
  imageUrl: string | null
  units: SaleUnit[]
  components: Component[]
  children: BranchChild[]
  purchaseUnitId: number | null
  purchaseConversionFactor: number | null
}

/** What the form sends; `image` is a new file, or the current image's URL to keep it. */
export type ProductInput = Omit<ProductFields, "id" | "code" | "balance" | "categoryName" | "imageUrl"> & { image: File | string | null }

export type ProductQuery = { page: number; pageSize: number; searchTerm?: string; barcode?: string; productType?: ProductType; categoryId?: number; sortBy?: string; sortDescending?: boolean }

/** Options the form passes along: the branch's tax mode decides which tax fields are sent. */

/**
 * An item as the server sends it. Each kind has its own endpoint with a few fields of its own, so this is the union of them:
 * prepared items add `components`, raw materials `purchaseUnitId` and `conversionFactor`, branched items `baseUnit` and `children`.
 */
export type Product = ProductDto & Partial<Pick<PreparedProductDto, "components">> & Partial<Omit<RawMaterialDto, keyof ProductDto>> & Partial<Pick<BranchedProductDto, "baseUnit" | "children">>
