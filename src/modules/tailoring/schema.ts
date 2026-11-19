import { z } from "zod"

/** The new customer window: a name is required, the phone is optional. */
export const newCustomerSchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  phone: z.string().trim(),
})
export type NewCustomerForm = z.infer<typeof newCustomerSchema>
