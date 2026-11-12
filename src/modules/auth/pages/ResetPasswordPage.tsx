import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthLayout } from "../components/AuthLayout"
import { AuthError, AuthField, authButtonClass } from "../components/AuthField"
import { useResetPassword } from "../queries"
import { resetSchema, type ResetForm } from "../schema"

/** Step 3 of 3: the new password. */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const email = (useLocation().state as { email?: string } | null)?.email
  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } })
  const reset = useResetPassword()
  const first = form.formState.errors.password?.message ?? form.formState.errors.confirmPassword?.message
  const error = reset.error?.message ?? (first && t(first))

  if (!email) return <Navigate to="/forgot-password" replace />

  const clear = { onChange: () => reset.reset() }
  return (
    <AuthLayout title={t("auth.resetTitle")} onBack={() => nav("/verify-otp", { state: { email } })}>
      {reset.isSuccess ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500"><Lock size={32} /></div>
          <h3 className="mb-2 text-lg font-bold">{t("auth.resetDone")}</h3>
          <button type="button" onClick={() => nav("/login")} className="mt-4 font-medium text-primary hover:underline">{t("auth.backToLogin")}</button>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit((v) => reset.mutate({ email, password: v.password }))} noValidate className="space-y-4">
          <AuthField icon={Lock} type="password" placeholder={t("auth.newPassword")} {...form.register("password", clear)} />
          <AuthField icon={Lock} type="password" placeholder={t("auth.confirmPassword")} {...form.register("confirmPassword", clear)} />
          {error && <AuthError>{error}</AuthError>}
          <button type="submit" disabled={reset.isPending} className={`mt-4 ${authButtonClass}`}>
            {reset.isPending ? <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t("auth.resetButton")}
          </button>
          <button type="button" onClick={() => nav("/login")} className="mt-4 w-full text-center font-medium text-primary hover:underline">{t("auth.backToLogin")}</button>
        </form>
      )}
    </AuthLayout>
  )
}
