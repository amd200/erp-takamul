import { z } from "zod"

export const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "validation.nameRequired"),
  mobile: z.string().trim().regex(/^\d*$/, "validation.digitsOnly"),
  branchId: z.number().optional(),
})
export type EmployeeForm = z.infer<typeof employeeSchema>
export const emptyEmployee: EmployeeForm = { firstName: "", mobile: "" }
