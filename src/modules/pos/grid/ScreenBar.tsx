import { useState, type ReactNode } from "react"
import { Check, Globe, Maximize, Minimize, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"

export type BarInfo = { icon: LucideIcon; label: string; value: ReactNode }

/**
 * The top bar of the full-screen invoice screens (sales 2, purchases 2): screen tools and the screen's
 * name on the start side, invoice facts in the middle, the screen's own actions on the end side.
 */
export function ScreenBar({ title, icon: Icon, info, actions }: { title: string; icon: LucideIcon; info: BarInfo[]; actions: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const [full, setFull] = useState(!!document.fullscreenElement)

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
      setFull(!!document.fullscreenElement)
    } catch { /* the browser may refuse; the screen works the same either way */ }
  }

  return (
    <header className="flex flex-col gap-3 rounded-b-2xl border border-t-0 bg-card px-3 py-3 shadow-sm sm:px-5 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="icon" aria-label={t("pos.fullscreen")} title={t("pos.fullscreen")} onClick={toggleFull}>{full ? <Minimize /> : <Maximize />}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={t("topbar.language")}><Globe /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {LANGUAGES.map((l) => <DropdownMenuItem key={l.code} onSelect={() => i18n.changeLanguage(l.code)}>{l.label}{i18n.language === l.code && <Check className="ms-auto" />}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" variant="outline" size="icon" aria-label={resolved === "dark" ? t("topbar.themes.light") : t("topbar.themes.dark")}
          onClick={() => setChoice(resolved === "dark" ? "light" : "dark")}>{resolved === "dark" ? <Sun /> : <Moon />}</Button>
        <span className="mx-1 hidden h-7 w-px bg-border sm:block" />
        <span className="inline-flex h-9 items-center gap-2 rounded-full border bg-background px-4 text-sm font-semibold"><Icon className="size-4 text-primary" />{title}</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:justify-center xl:gap-0">
        {info.map((x, i) => (
          <div key={x.label} className={i > 0 ? "flex min-w-0 items-center justify-center gap-2.5 px-2 xl:border-s xl:px-5" : "flex min-w-0 items-center justify-center gap-2.5 px-2 xl:px-5"}>
            <x.icon className="size-[18px] shrink-0 text-primary" />
            <div className="flex min-w-0 flex-col items-center">
              <dt className="text-[11px] text-muted-foreground">{x.label}</dt>
              <dd className="max-w-full truncate text-sm font-bold tabular-nums">{x.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">{actions}</div>
    </header>
  )
}
