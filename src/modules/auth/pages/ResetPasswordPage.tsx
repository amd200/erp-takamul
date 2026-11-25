import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { errorToast } from "@/shared/api/errors"
import { ApiError } from "@/shared/http/ApiError"
import { AuthLayout } from "../components/AuthLayout"
import { AuthError, AuthField, authButtonClass } from "../components/AuthField"
import { useResetPassword } from "../queries"
import { resetSchema, type ResetForm } from "../schema"

/** Step 3 of 3: the new password. The grant from step 2 travels only in the router state, never in storage. */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { email, resetGrant } = (useLocation().state as { email?: string; resetGrant?: string } | null) ?? {}
  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } })
  const reset = useResetPassword()
  const first = form.formState.errors.password?.message ?? form.formState.errors.confirmPassword?.message
  const error = first && t(first)

  if (!email || !resetGrant) return <Navigate to="/forgot-password" replace />

  // An expired grant only needs the code again; a missing, invalid or used one means starting over.
  const onError = (e: unknown) => {
    errorToast(e, "common.unexpected")
    if (!(e instanceof ApiError)) return
    if (e.code === "RESET_GRANT_EXPIRED") nav("/verify-otp", { state: { email }, replace: true })
    else if (e.code === "RESET_GRANT_INVALID" || e.code === "RESET_GRANT_CONSUMED") nav("/forgot-password", { replace: true })
  }
  const onSuccess = () => { toast.success(t("auth.resetDone")); nav("/login", { replace: true }) }

  return (
    <AuthLayout title={t("auth.resetTitle")} onBack={() => nav("/verify-otp", { state: { email } })}>
      <form onSubmit={form.handleSubmit((v) => reset.mutate({ email, password: v.password, resetGrant }, { onSuccess, onError }))} noValidate className="space-y-4">
        <AuthField icon={Lock} type="password" placeholder={t("auth.newPassword")} {...form.register("password")} />
        <AuthField icon={Lock} type="password" placeholder={t("auth.confirmPassword")} {...form.register("confirmPassword")} />
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={reset.isPending} className={`mt-4 ${authButtonClass}`}>
          {reset.isPending ? <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t("auth.resetButton")}
        </button>
        <button type="button" onClick={() => nav("/login")} className="mt-4 w-full text-center font-medium text-primary hover:underline">{t("auth.backToLogin")}</button>
      </form>
    </AuthLayout>
  )
}
