import { z } from "zod"

export const adjustmentSchema = z.object({
  date: z.string(),
  notes: z.string(),
  lines: z
    .array(z.object({
      stockInventoryId: z.number().min(1, "validation.itemRequired"),
      unitId: z.number().nullable(),
      operation: z.enum(["Add", "Remove"]),
      quantity: z.number({ error: "validation.number" }).positive("validation.qtyPositive"),
    }))
    .min(1, "validation.linesRequired"),
})

export type AdjustmentForm = z.infer<typeof adjustmentSchema>
