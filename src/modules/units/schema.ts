import { z } from "zod"

export const unitSchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  taxCode: z.string().trim().toUpperCase().max(6, "validation.taxCodeLength"),
  description: z.string().trim(),
})

export type UnitForm = z.infer<typeof unitSchema>
export const emptyUnit: UnitForm = { name: "", taxCode: "", description: "" }
