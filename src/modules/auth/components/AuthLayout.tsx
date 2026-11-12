import { Fragment, type ReactNode } from "react"
import { ArrowRight, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useTheme } from "@/shared/theme/ThemeProvider"

/** The old system's sign-in frame (takamul2 auth pages): textured background, card + logos side by side. */
const LANG_LABELS = { ar: "عربي", en: "English", bn: "Bangla" } as const

type Props = { title: string; description?: string; onBack?: () => void; children: ReactNode }

export function AuthLayout({ title, description, onBack, children }: Props) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const isDark = resolved === "dark"
  const lang = i18n.language === "en" || i18n.language === "bn" ? i18n.language : "ar"

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
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl transition-colors duration-300 sm:rounded-xl sm:p-10">
          {onBack && (
            <button type="button" onClick={onBack} className="absolute start-6 top-6 text-muted-foreground transition-colors hover:text-primary">
              <ArrowRight size={24} className="ltr:rotate-180" />
            </button>
          )}
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="mt-6 text-2xl font-bold">{title}</h1>
            {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          </div>
          {children}
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
