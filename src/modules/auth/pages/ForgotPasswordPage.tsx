import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { Mail } from "lucide-react"
import { useTranslation } from "react-i18next"
import { errorToast } from "@/shared/api/errors"
import { AuthLayout } from "../components/AuthLayout"
import { AuthError, AuthField, authButtonClass } from "../components/AuthField"
import { useForgetPassword } from "../queries"
import { forgotSchema, type ForgotForm } from "../schema"

/** Step 1 of 3: ask for the email; the server mails a 6-digit code. */
export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } })
  const send = useForgetPassword()
  const error = form.formState.errors.email?.message && t(form.formState.errors.email.message)

  return (
    <AuthLayout title={t("auth.forgotTitle")} description={sentTo ? undefined : t("auth.forgotDescription")} onBack={() => nav("/login")}>
      {sentTo === null ? (
        <form onSubmit={form.handleSubmit((v) => send.mutate(v.email, { onSuccess: () => setSentTo(v.email), onError: (e) => errorToast(e, "common.unexpected") }))} noValidate className="space-y-4">
          <AuthField icon={Mail} type="email" placeholder={t("auth.email")} {...form.register("email")} />
          {error && <AuthError>{error}</AuthError>}
          <button type="submit" disabled={send.isPending} className={`mt-4 ${authButtonClass}`}>
            {send.isPending ? <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t("auth.sendLink")}
          </button>
        </form>
      ) : (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500"><Mail size={32} /></div>
          <h3 className="mb-2 text-lg font-bold">{t("auth.sentTitle")}</h3>
          <p className="mb-6 text-sm text-muted-foreground">{t("auth.sentDescription")}</p>
          <button type="button" onClick={() => nav("/verify-otp", { state: { email: sentTo } })} className={`mb-3 ${authButtonClass}`}>{t("auth.enterOtp")}</button>
          <button type="button" onClick={() => nav("/login")} className="font-medium text-primary hover:underline">{t("auth.backToLogin")}</button>
        </div>
      )}
    </AuthLayout>
  )
}
