import { z } from "zod"

export const loginSchema = z.object({
  identifier: z.string().min(1, "validation.identifierRequired"),
  password: z.string().min(1, "validation.passwordRequired"),
})
export type LoginForm = z.infer<typeof loginSchema>

export const forgotSchema = z.object({ email: z.string().trim().min(1, "validation.emailRequired").email("validation.emailInvalid") })
export type ForgotForm = z.infer<typeof forgotSchema>

export const resetSchema = z.object({ password: z.string(), confirmPassword: z.string() }).superRefine((v, ctx) => {
  if (v.password.length < 8) ctx.addIssue({ code: "custom", path: ["password"], message: "validation.passwordMin" })
  if (v.password !== v.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "validation.passwordMatch" })
})
export type ResetForm = z.infer<typeof resetSchema>
