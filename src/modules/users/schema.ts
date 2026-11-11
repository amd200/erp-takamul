import { z } from "zod"

const base = z.object({
  // Not on the form: a new user is named after their user name (see UserDialog), and the name cannot be edited.
  name: z.string().trim(),
  userName: z.string().trim()
    .min(3, "validation.userNameMin")
    .max(30, "validation.userNameMax")
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "validation.userNameFormat"),
  email: z.string().trim().min(1, "validation.emailRequired").email("validation.emailInvalid"),
  mobile: z.string().trim().regex(/^\d*$/, "validation.digitsOnly"),
  branchId: z.number({ error: "validation.branchRequired" }).min(1, "validation.branchRequired"),
  roleName: z.string({ error: "validation.roleRequired" }).min(1, "validation.roleRequired"),
  isMultiBranch: z.boolean(),
  password: z.string(),
  confirmPassword: z.string(),
})

/** New users need a password; when editing, an empty password keeps the current one. */
export const buildUserSchema = (isNew: boolean) =>
  base.superRefine((v, ctx) => {
    if ((isNew || v.password) && v.password.length < 8) ctx.addIssue({ code: "custom", path: ["password"], message: "validation.passwordMin" })
    if (v.password !== v.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "validation.passwordMatch" })
  })

export type UserForm = z.infer<typeof base>
export const emptyUser: UserForm = { name: "", userName: "", email: "", mobile: "", branchId: 0, roleName: "", isMultiBranch: false, password: "", confirmPassword: "" }

export const changePasswordSchema = z.object({
  password: z.string().min(8, "validation.passwordMin"),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "validation.passwordMatch" })

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>
