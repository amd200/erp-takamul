import { useState } from "react"
import { Check, Globe, Home, Maximize, Minimize, Moon, Sun } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAppSettings } from "@/modules/settings"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"

const tool = "size-7 border-pos-purchase text-pos-purchase transition-colors hover:bg-pos-purchase hover:text-pos-purchase-foreground dark:border-border dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground"

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-0 flex-col items-center gap-0.5">
    <span className="text-[10px] text-blue-400">{label}</span>
    <span className="text-[11px] font-semibold text-pos-purchase dark:text-foreground">{value}</span>
  </div>
)

/**
 * The top row of the second purchases screen, as in the current system: screen tools and the screen's name on one side,
 * the next invoice number, the shift and today's date in the middle, and the way back home on the other side.
 */
export function PurchaseBar({ invoiceNumber, shiftId }: { invoiceNumber: string; shiftId?: number }) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const [full, setFull] = useState(!!document.fullscreenElement)

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
      setFull(!!document.fullscreenElement)
    } catch { /* the browser may refuse; the screen works the same either way */ }
  }
  const now = new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, numberingSystem: "latn" }).format(new Date())

  return (
    <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" className={tool} aria-label={t("pos.fullscreen")} title={t("pos.fullscreen")} onClick={toggleFull}>{full ? <Minimize size={13} /> : <Maximize size={13} />}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" className={tool} aria-label={t("topbar.language")}><Globe size={13} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {LANGUAGES.map((l) => <DropdownMenuItem key={l.code} onSelect={() => i18n.changeLanguage(l.code)}>{l.label}{i18n.language === l.code && <Check className="ms-auto" />}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          {!beauty && (
            <Button type="button" variant="outline" size="icon" className={tool} aria-label={resolved === "dark" ? t("topbar.themes.light") : t("topbar.themes.dark")}
              onClick={() => setChoice(resolved === "dark" ? "light" : "dark")}>{resolved === "dark" ? <Sun size={13} /> : <Moon size={13} />}</Button>
          )}
        </div>
        <div className="h-5 w-px bg-border" />
        <span className="inline-flex h-7 items-center rounded-full border border-pos-purchase px-3 text-[11px] font-medium text-pos-purchase dark:border-border dark:text-foreground">{t("pos3.title")}</span>
      </div>

      <div className="grid w-full grid-cols-3 gap-2 lg:flex lg:w-auto lg:gap-6">
        <Fact label={t("pos2.invoiceNumber")} value={invoiceNumber} />
        <Fact label={t("pos2.shiftCode")} value={shiftId ? String(shiftId) : "---"} />
        <Fact label={t("pos3.today")} value={now} />
      </div>

      <div className="absolute end-4 top-0 flex items-center gap-1 lg:static">
        <Button asChild size="sm" className="h-7 rounded-full bg-brand-green text-[11px] text-white hover:opacity-80 active:scale-95">
          <Link to="/">{t("pos3.home")}<Home className="size-3" /></Link>
        </Button>
      </div>
    </div>
  )
}
