import type { ReactNode } from "react"
import { Globe, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"

/**
 * Two halves on wide screens: the brand panel (navy, with the logo's green swoosh) and the form.
 * On phones only the form shows, with the logo above it.
 */
export function AuthLayout({ title, description, children, footer }: { title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const other = LANGUAGES.find((l) => l.code !== i18n.language) ?? LANGUAGES[0]

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo className="h-10 lg:invisible" />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => i18n.changeLanguage(other.code)}><Globe />{other.label}</Button>
            <Button variant="ghost" size="icon" aria-label={t("topbar.theme")} onClick={() => setChoice(resolved === "dark" ? "light" : "dark")}>
              {resolved === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold text-balance">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {children}
          {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
        </main>
        <p className="text-center text-xs text-faint">© {new Date().getFullYear()} {t("app.name")}</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-brand-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <Logo onDark className="h-14" />
        </div>
        <div className="relative z-10 flex max-w-md flex-col gap-4">
          <h2 className="text-3xl leading-snug font-bold text-balance">{t("auth.panelTitle")}</h2>
          <p className="text-lg text-white/70">{t("auth.panelBody")}</p>
          <ul className="mt-2 flex flex-col gap-2 text-white/80">
            {(["sales", "stock", "zatca"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2.5"><span className="size-1.5 rounded-full bg-[#5cbf6a]" />{t(`auth.points.${k}`)}</li>
            ))}
          </ul>
        </div>
        {/* The swoosh from the logo, drawn large across the panel. */}
        <svg viewBox="0 0 600 200" className="pointer-events-none absolute -bottom-6 start-0 w-[120%] rtl:-scale-x-100" aria-hidden>
          <path d="M0 190 C 180 150, 360 90, 600 20 L 600 60 C 380 120, 200 170, 0 200 Z" fill="#2f8f3a" />
          <path d="M0 200 C 200 168, 380 112, 600 52 L 600 64 C 390 122, 210 176, 0 200 Z" fill="#1f6b2a" />
        </svg>
        <p className="relative z-10 text-sm text-white/50">{t("auth.panelFoot")}</p>
      </aside>
    </div>
  )
}
