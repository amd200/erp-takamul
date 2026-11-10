import { Fragment, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ApiError } from "@/shared/http/ApiError"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { authApi } from "../service"
import { useLogin } from "../queries"
import { loginSchema, type LoginForm } from "../schema"

/** The old system's sign-in screen (takamul2 `pages/Login.tsx`): textured background, card + logos side by side. */
const LANG_LABELS = { ar: "عربي", en: "English", bn: "Bangla" } as const

const fieldClass =
  "h-auto w-full px-4 py-4 text-base sm:text-sm rounded-xl outline-none transition-colors border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary bg-card dark:bg-input border-border text-foreground placeholder:text-muted-foreground"

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/"
  const { resolved, setChoice } = useTheme()
  const isDark = resolved === "dark"
  const lang = i18n.language === "en" || i18n.language === "bn" ? i18n.language : "ar"
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
    <div
      className="relative flex min-h-dvh w-screen flex-col overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundImage: "url('https://static.portal.daftra.com/images/back-sign-in-texture.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: isDark ? "#0f172a" : "#dde4ee",
      }}
    >
      <div className="absolute inset-0 transition-all duration-300" style={{ background: isDark ? "rgba(10,15,35,0.78)" : "rgba(220,228,240,0.42)" }} />

      <nav className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-10 sm:py-5">
        <div className={cn("flex items-center gap-3 rounded-full border px-5 py-2 text-sm font-bold", isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-black/10 bg-white/70 text-slate-500")}>
          {(["ar", "en", "bn"] as const).map((l, i) => (
            <Fragment key={l}>
              {i > 0 && <span className="opacity-40">|</span>}
              <button type="button" onClick={() => i18n.changeLanguage(l)} className={cn("font-bold transition-colors", lang === l ? "text-success" : "hover:text-success")}>
                {LANG_LABELS[l]}
              </button>
            </Fragment>
          ))}
        </div>
        <button type="button" onClick={() => setChoice(isDark ? "light" : "dark")} className={cn("flex size-12 items-center justify-center rounded-full transition-all hover:bg-success/10 hover:text-success", isDark ? "text-slate-400" : "text-slate-500")}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </nav>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 px-4 pt-2 pb-8 sm:px-10 sm:py-4 lg:overflow-hidden lg:gap-10 lg:flex-row lg:gap-20 rtl:lg:flex-row-reverse">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl transition-colors duration-300 sm:rounded-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="mt-6 text-2xl font-bold">{t("login.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("login.sub")}</p>
          </div>

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
        </div>

        <div className="mb-12 hidden flex-1 shrink-0 flex-col items-center justify-center gap-4 lg:flex">
          <img src={`/logo_${lang === "ar" ? "ar" : "en"}_${isDark ? "dark" : "light"}.png`} alt="Takamul logo" className="ms-12 mb-8 object-contain drop-shadow-2xl transition-all duration-500" style={{ height: 170, width: "auto", maxWidth: "100%" }} />
          <img src={isDark ? "/zakat_en_dark.png" : "/zakat_en_light.png"} alt={t("login.zatcaName")} className="object-contain drop-shadow-xl transition-all duration-500" style={{ height: 90, width: "auto", maxWidth: "100%" }} />
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{t("login.download")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="#" className="transition-transform hover:scale-105">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="rounded shadow-lg" style={{ height: 40, width: "auto" }} />
              </a>
              <a href="#" className="transition-transform hover:scale-105">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="rounded shadow-lg" style={{ height: 40, width: "auto" }} />
              </a>
              <a href="#" className="transition-transform hover:scale-105">
                <img src="/win.png" alt="Windows" className="rounded shadow-lg" style={{ height: 40, width: "auto" }} />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
