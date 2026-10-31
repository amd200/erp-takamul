import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { FormInput } from "@/components/form/FormFields"
import { authApi } from "../service"
import { AuthLayout } from "../components/AuthLayout"
import { resetSchema, type ResetForm } from "../schema"

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const state = useLocation().state as { token?: string; email?: string } | null
  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } })
  const reset = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => { toast.success(t("auth.passwordChanged")); nav("/login") },
  })

  if (!state?.email) return <Navigate to="/forgot-password" replace />

  return (
    <AuthLayout title={t("auth.resetTitle")} description={t("auth.resetDescription")}>
      <form onSubmit={form.handleSubmit((v) => reset.mutate({ email: state?.email ?? "", token: state?.token ?? "", password: v.password }))} noValidate className="flex flex-col gap-5">
        <FieldGroup className="gap-4">
          <FormInput control={form.control} name="password" type="password" dir="ltr" label={t("users.newPassword")} description={t("users.passwordHint")} />
          <FormInput control={form.control} name="confirmPassword" type="password" dir="ltr" label={t("users.confirmPassword")} />
        </FieldGroup>
        {reset.isError && <p role="alert" className="text-sm text-destructive">{reset.error.message}</p>}
        <Button type="submit" size="lg" className="h-10" disabled={reset.isPending}>{reset.isPending && <Loader2 className="animate-spin" />}{t("auth.savePassword")}</Button>
      </form>
    </AuthLayout>
  )
}
