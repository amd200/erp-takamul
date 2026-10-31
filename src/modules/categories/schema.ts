import { z } from "zod"
import type { Category } from "./types"

export const categorySchema = z.object({
  categoryNameAr: z.string().trim().min(1, "validation.nameArRequired"),
  categoryNameEn: z.string().trim(),
  description: z.string().trim(),
  parentCategoryId: z.number().nullable(),
  displayOrder: z.number({ error: "validation.number" }).int("validation.wholeNumber").min(0, "validation.min0"),
  printerName: z.string().nullable(),
})

export type CategoryForm = z.infer<typeof categorySchema>

export const emptyCategory: CategoryForm = { categoryNameAr: "", categoryNameEn: "", description: "", parentCategoryId: null, displayOrder: 0, printerName: null }

/** Empty text belongs to form controls; API records remain unchanged. */
export const categoryFormValues = (category: Category): CategoryForm => ({
  categoryNameAr: category.categoryNameAr ?? "",
  categoryNameEn: category.categoryNameEn ?? "",
  description: category.description ?? "",
  parentCategoryId: category.parentCategoryId,
  displayOrder: category.displayOrder,
  printerName: null,
})
