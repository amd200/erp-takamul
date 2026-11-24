import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/shared/http/ApiError"
import { safeFrom } from "../components/AuthGate"
import { AuthLayout } from "../components/AuthLayout"
import { authFieldClass as fieldClass } from "../components/AuthField"
import { authApi } from "../service"
import { useLogin } from "../queries"
import { loginSchema, type LoginForm } from "../schema"

export default function LoginPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const from = safeFrom((useLocation().state as { from?: string } | null)?.from)
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState("")
  const [conflict, setConflict] = useState(false)

  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: "", password: "" } })
  const login = useLogin()
  const logoutAll = useMutation({
    mutationFn: () => authApi.logoutAll(form.getValues("identifier")),
    onSuccess: () => { setConflict(false); setError("") },
  })

  const clearError = () => { setConflict(false); setError("") }
  const submit = form.handleSubmit((v) => {
    clearError()
    login.mutate(v, {
      onSuccess: () => { toast.success(t("login.success")); nav(from, { replace: true }) },
      onError: (err) => {
        if (!(err instanceof ApiError)) return
        setError(err.message)
        if (err.status === 409 && err.code === "DEVICE_CONFLICT") setConflict(true)
      },
    })
  })

  return (
    <AuthLayout title={t("login.title")} description={t("login.sub")}>
      <form onSubmit={submit} className="space-y-4">
        <Input type="text" placeholder={t("login.userPh")} className={fieldClass} required
          {...form.register("identifier", { onChange: clearError })} />

        <div className="relative">
          <Input type={reveal ? "text" : "password"} placeholder={t("login.passPh")} className={fieldClass} required
            {...form.register("password", { onChange: clearError })} />
          <button type="button" onClick={() => setReveal(!reveal)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary">
            {reveal ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="py-1 text-center text-sm text-red-500">{error}</p>}

        {conflict && (
          <button type="button" onClick={() => logoutAll.mutate()} disabled={logoutAll.isPending} className="flex w-full cursor-pointer items-center justify-center gap-2 text-xs font-medium text-[#4b5563] underline underline-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
            {logoutAll.isPending ? <span className="inline-block size-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-500" /> : t("login.logoutAll")}
          </button>
        )}

        <div className="flex items-center justify-between py-2 text-sm">
          {/* The old screen's checkbox is not wired to anything either. */}
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="size-4 rounded border-border accent-primary" />
            <span className="text-muted-foreground">{t("login.remember")}</span>
          </label>
          <button type="button" onClick={() => nav("/forgot-password")} className="font-medium text-muted-foreground transition-colors hover:text-primary">
            {t("login.forgot")}
          </button>
        </div>

        <button type="submit" disabled={login.isPending} className="mt-4 w-full rounded-lg bg-primary py-4 sm:py-3 text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
          {login.isPending ? <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t("login.loginBtn")}
        </button>
      </form>
    </AuthLayout>
  )
}
