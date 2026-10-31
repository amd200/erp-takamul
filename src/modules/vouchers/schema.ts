import { z } from "zod"

export const voucherSchema = z.object({
  partyType: z.enum(["customer", "supplier"]),
  partyId: z.number({ error: "validation.partyRequired" }).min(1, "validation.partyRequired"),
  treasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  date: z.string().min(1, "validation.dateRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
  description: z.string().trim(),
})
export type VoucherForm = z.infer<typeof voucherSchema>
