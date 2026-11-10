import { z } from "zod"

export const additionSchema = z.object({
  nameAr: z.string().trim().min(1, "validation.nameArRequired"),
  nameEn: z.string().trim(),
  nameUr: z.string().trim(),
  categoryIds: z.array(z.number()).min(1, "validation.pickCategory"),
})

export type AdditionForm = z.infer<typeof additionSchema>
export const emptyAddition: AdditionForm = { nameAr: "", nameEn: "", nameUr: "", categoryIds: [] }
