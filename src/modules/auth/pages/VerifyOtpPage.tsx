import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { authApi } from "../service"
import { AuthLayout } from "../components/AuthLayout"

const RESEND_AFTER = 60

export default function VerifyOtpPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const email = (useLocation().state as { email?: string } | null)?.email
  const sentTo = email?.replace(/^(.{2}).*(@.*)$/, "$1•••$2")
  const [otp, setOtp] = useState("")
  const [wait, setWait] = useState(RESEND_AFTER)
  const verify = useMutation({ mutationFn: authApi.verifyOtp, onSuccess: (r) => nav("/reset-password", { state: { email, token: r.resetToken } }) })
  const resend = useMutation({ mutationFn: () => authApi.forgotPassword(email ?? ""), onSuccess: () => setWait(RESEND_AFTER) })

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  // Submits as soon as the sixth digit is typed.
  const change = (v: string) => { setOtp(v); if (v.length === 6) verify.mutate({ email: email ?? "", otp: v }) }

  // Opening this page directly (no email to verify) goes back to the start.
  if (!email) return <Navigate to="/forgot-password" replace />

  return (
    <AuthLayout title={t("auth.otpTitle")} description={sentTo ? t("auth.otpSentTo", { to: sentTo }) : t("auth.otpDescription")}
      footer={<Link to="/login" className="font-medium text-primary hover:underline">{t("auth.backToLogin")}</Link>}>
      <form onSubmit={(e) => { e.preventDefault(); verify.mutate({ email: email ?? "", otp }) }} className="flex flex-col items-start gap-5">
        <div dir="ltr" className="self-center">
          <InputOTP maxLength={6} value={otp} onChange={change} aria-label={t("devices.otp")} aria-invalid={verify.isError} autoFocus>
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} className="size-12 text-lg" />)}</InputOTPGroup>
          </InputOTP>
        </div>
        {verify.isError && <p role="alert" className="self-center text-sm text-destructive">{t("auth.otpInvalid")}</p>}
        <Button type="submit" size="lg" className="h-10 w-full" disabled={otp.length !== 6 || verify.isPending}>
          {verify.isPending && <Loader2 className="animate-spin" />}{t("auth.verify")}
        </Button>
        <p className="self-center text-sm text-muted-foreground">
          {wait > 0 ? t("auth.resendIn", { seconds: wait }) : (
            <Button type="button" variant="link" className="h-auto p-0" disabled={resend.isPending} onClick={() => resend.mutate()}>{t("auth.resend")}</Button>
          )}
        </p>
      </form>
    </AuthLayout>
  )
}
