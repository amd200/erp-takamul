import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useTheme } from "@/shared/theme/ThemeProvider"

/**
 * The Takamul wordmark in the interface language. `onDark` forces the white version for
 * dark surfaces (the navy login panel); otherwise it follows the current theme.
 */
export function Logo({ className, onDark }: { className?: string; onDark?: boolean }) {
  const { t, i18n } = useTranslation()
  const { resolved } = useTheme()
  const lang = i18n.language === "en" ? "en" : "ar"
  const tone = onDark || resolved === "dark" ? "dark" : "light"
  return <img src={`/logo_${lang}_${tone}.png`} alt={t("app.name")} className={cn("h-10 w-auto select-none", className)} draggable={false} />
}
