import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/FormFields"
import { authApi } from "../service"
import { AuthLayout } from "../components/AuthLayout"
import { forgotSchema, type ForgotForm } from "../schema"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } })
  const send = useMutation({ mutationFn: authApi.forgotPassword })

  return (
    <AuthLayout title={t("auth.forgotTitle")} description={t("auth.forgotDescription")}
      footer={<Link to="/login" className="font-medium text-primary hover:underline">{t("auth.backToLogin")}</Link>}>
      <form onSubmit={form.handleSubmit((v) => send.mutate(v.email, { onSuccess: () => nav("/verify-otp", { state: { email: v.email } }) }))} noValidate className="flex flex-col gap-5">
        <FormInput control={form.control} name="email" type="email" label={t("users.email")} dir="ltr" placeholder="name@company.com" />
        {send.isError && <p role="alert" className="text-sm text-destructive">{send.error.message}</p>}
        <Button type="submit" size="lg" className="h-10" disabled={send.isPending}>{send.isPending && <Loader2 className="animate-spin" />}{t("auth.sendCode")}</Button>
      </form>
    </AuthLayout>
  )
}
