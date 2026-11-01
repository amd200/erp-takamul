import { useMemo, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useSession } from "@/shared/session/session"

/** The welcome card: a calm banner with the date, the greeting and the subtitle. */
export function Hero() {
  const { t, i18n } = useTranslation()
  const { user } = useSession()
  const date = useMemo(() => new Intl.DateTimeFormat(i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()), [i18n.language])
  return (
    <Card className="relative flex-row flex-wrap items-center justify-between gap-8 overflow-hidden bg-gradient-to-l from-secondary via-card to-card px-8 py-10">
      {/* Two faint circles in the corner, the only decoration. */}
      <span className="pointer-events-none absolute -start-16 -top-20 size-64 rounded-full bg-primary/5" aria-hidden />
      <span className="pointer-events-none absolute -start-4 -bottom-24 size-48 rounded-full bg-primary/5" aria-hidden />
      <div className="relative flex min-w-0 flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">{date}</p>
        <h1 className="text-3xl font-bold text-balance">{user.name ? t("home.greeting", { name: user.name }) : t("nav.home")}</h1>
        <p className="text-muted-foreground">{t("home.subtitle")}</p>
      </div>
    </Card>
  )
}

/** One of erpv2's stat tiles: a label with an icon chip and the figure under it. */
export function Stat({ icon: Icon, label, value, tone = "default", to }: { icon: LucideIcon; label: string; value: ReactNode; tone?: "default" | "warning" | "success" | "danger"; to?: string }) {
  const body = (
    <Card className={cn("h-full gap-3 px-4", to && "transition-colors hover:bg-muted/50")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", tone === "warning" ? "bg-warning-soft text-warning" : tone === "success" ? "bg-success-soft text-success" : tone === "danger" ? "bg-destructive-soft text-destructive" : "bg-secondary text-secondary-foreground")}><Icon /></span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  )
  return to ? <Link to={to} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{body}</Link> : body
}
