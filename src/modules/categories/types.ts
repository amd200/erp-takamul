/** Raw fields returned by /ProductCategories. */
export type Category = {
  id: number
  branchId: number
  categoryNameAr: string
  categoryNameEn: string | null
  categoryNameUr: string | null
  description: string | null
  parentCategoryId: number | null
  displayOrder: number
  isActive: number
  imageUrl: string | null
  subCategories: Category[]
}

/** Form values; printerName applies to the category's products when editing. */
export type CategoryInput = {
  categoryNameAr: string
  categoryNameEn: string
  description: string
  parentCategoryId: number | null
  displayOrder: number
  printerName: string | null
}
export type CategoryQuery = { page: number; pageSize: number; searchTerm?: string }
