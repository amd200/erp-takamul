/** Mirrors /Additions, as the server sends it: options a customer picks with an item (extra cheese, no onions). */
export type Addition = {
  id: number
  additionNameAr: string
  additionNameEn?: string | null
  additionNameUr?: string | null
  categoryIds: number[]
  categories?: { id: number; categoryNameAr: string; categoryNameEn?: string | null; categoryNameUr?: string | null }[]
  isActive: boolean
  createdAt: string
}

/** What the add / edit form holds. The server has no way to toggle isActive from the app. */
export type AdditionInput = { nameAr: string; nameEn: string; categoryIds: number[] }

export type AdditionQuery = { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }
