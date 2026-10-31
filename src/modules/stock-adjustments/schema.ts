import { z } from "zod"

export const adjustmentSchema = z.object({
  notes: z.string(),
  lines: z
    .array(z.object({
      productId: z.number().min(1, "validation.itemRequired"),
      operation: z.enum(["Add", "Remove"]),
      quantity: z.number({ error: "validation.number" }).positive("validation.qtyPositive"),
    }))
    .min(1, "validation.linesRequired"),
})

export type AdjustmentForm = z.infer<typeof adjustmentSchema>
