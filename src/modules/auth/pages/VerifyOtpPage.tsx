import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { KeyRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthLayout } from "../components/AuthLayout"
import { AuthError, AuthField, authButtonClass } from "../components/AuthField"
import { useVerifyOtp } from "../queries"
import { otpSchema, type OtpForm } from "../schema"

/** Step 2 of 3: the 6-digit code from the email. */
export default function VerifyOtpPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const email = (useLocation().state as { email?: string } | null)?.email
  const form = useForm<OtpForm>({ resolver: zodResolver(otpSchema), defaultValues: { otp: "" } })
  const verify = useVerifyOtp()
  const error = verify.error?.message ?? (form.formState.errors.otp?.message && t(form.formState.errors.otp.message))

  // Opening this page directly (no email to verify) goes back to the start.
  if (!email) return <Navigate to="/forgot-password" replace />

  return (
    <AuthLayout title={t("auth.otpTitle")} description={t("auth.otpDescription")} onBack={() => nav("/forgot-password")}>
      <form onSubmit={form.handleSubmit((v) => verify.mutate({ email, otp: v.otp }, { onSuccess: () => nav("/reset-password", { state: { email }, replace: true }) }))} noValidate className="space-y-4">
        <AuthField icon={KeyRound} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder={t("auth.otpCode")} maxLength={6}
          {...form.register("otp", { onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, ""); verify.reset() } })} />
        {error && <AuthError>{error}</AuthError>}
        <button type="submit" disabled={verify.isPending} className={`mt-4 ${authButtonClass}`}>
          {verify.isPending ? <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t("auth.verify")}
        </button>
        <button type="button" onClick={() => nav("/login")} className="mt-4 w-full text-center font-medium text-primary hover:underline">{t("auth.backToLogin")}</button>
      </form>
    </AuthLayout>
  )
}
