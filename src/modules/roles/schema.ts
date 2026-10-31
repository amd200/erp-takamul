import { z } from "zod"

export const roleSchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  permissions: z.array(z.string()),
})
export type RoleForm = z.infer<typeof roleSchema>
