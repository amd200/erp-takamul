import { z } from "zod"
import { lineSchema, paymentFormSchema } from "@/modules/sales/schema"

export const purchaseSchema = z.object({
  supplierId: z.number({ error: "validation.supplierRequired" }).min(1, "validation.supplierRequired"),
  warehouseId: z.number({ error: "validation.warehouseRequired" }).min(1, "validation.warehouseRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  notes: z.string(),
  lines: z.array(lineSchema).min(1, "validation.linesRequired"),
  payments: z.array(paymentFormSchema),
})

export type PurchaseForm = z.infer<typeof purchaseSchema>

const today = () => new Date().toISOString().slice(0, 10)
export const emptyPurchase = (): PurchaseForm => ({ supplierId: 0, warehouseId: 0, date: today(), notes: "", lines: [], payments: [] })
