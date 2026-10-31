import { Link, NavLink, Navigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { LIST_SECTIONS } from "../lists"
import { TabForm } from "../components/TabForm"
import { ZatcaPanel } from "../components/ZatcaPanel"
import { isForm, TABS } from "../tabs"
import { useAppSettings } from "../queries"

/**
 * One of the two settings pages, laid out as in the current system: the sales settings (tabs across the top of one
 * card) and the site settings (a side menu beside the chosen box).
 */
export default function SettingsPage() {
  const { t } = useTranslation()
  const { group: groupParam, section: id } = useParams()
  const page: "sales" | "system" = groupParam === "system" ? "system" : "sales"
  const can = useCan()
  const settings = useAppSettings()
  const tabs = TABS.filter((x) => x.page === page && (x.id !== "zatca" || settings.taxSetting?.taxSetting === "SecondStage"))
  const tab = tabs.find((x) => x.id === id)
  if (!tab) return <Navigate to={`/settings/${page}/${tabs[0].id}`} replace />

  const List = LIST_SECTIONS[tab.id]
  const readOnly = !can(tab.perm)
  const body = List ? <List key={tab.id} readOnly={readOnly} /> : tab.id === "zatca" ? <ZatcaPanel readOnly={readOnly} /> : isForm(tab) ? <TabForm key={tab.id} tab={tab} readOnly={readOnly} /> : null

  if (page === "sales") {
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">{t("nav.home")}</Link>
          <span>/</span>
          <Link to="/settings/system" className="hover:text-primary">{t("nav.settings")}</Link>
          <span>/</span>
          <span className="text-foreground">{t("settings.salesTitle")}</span>
        </div>
        <Card>
          <CardHeader className="max-md:flex max-md:flex-col">
            <CardTitle>{t("settings.salesTitle")}</CardTitle>
            <CardDescription>{t("settings.requiredNote")}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="min-w-0 rounded-2xl border border-border bg-muted/35 p-1.5 sm:p-2">
                <nav aria-label={t("nav.settings")} className="grid w-full grid-cols-2 items-stretch justify-start gap-2 sm:flex sm:flex-wrap">
                  {tabs.map((s) => {
                    const Icon = s.icon
                    return (
                      <NavLink key={s.id} to={`/settings/${page}/${s.id}`}
                        className={({ isActive }) => cn("group/tab flex h-auto min-h-12 min-w-0 max-w-full flex-none items-center justify-start gap-1.5 rounded-lg border border-transparent px-2.5 py-2.5 text-start text-xs whitespace-normal transition-colors sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm max-sm:border-border max-sm:bg-background/50",
                          isActive ? "bg-background/80 font-medium text-green-600 max-sm:border-green-500/40 max-sm:bg-green-50 dark:text-green-400" : "text-[var(--text-muted)] hover:bg-background/60 hover:text-foreground")}>
                        <Icon aria-hidden="true" className="size-4 shrink-0 opacity-65 group-[.active]/tab:opacity-100" />
                        <span className="min-w-0 break-words leading-5">{t(`settings.s.${s.id}`)}</span>
                      </NavLink>
                    )
                  })}
                </nav>
              </div>
              <div className="min-w-0">{body}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("nav.siteSettings")}</CardTitle>
        <CardAction>
          <Button asChild size="xl" variant="outline"><Link to="/">{t("sales.cancelBack")}<ArrowLeft size={16} /></Link></Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="relative flex flex-col items-start gap-8 md:flex-row">
          <div className="w-full md:w-64">
            <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border bg-[var(--bg-main)]/50 p-4 font-bold text-[var(--text-main)]">
                <Settings size={20} className="text-primary" />{t("nav.siteSettings")}
              </div>
              <nav aria-label={t("nav.settings")} className="space-y-1 p-2">
                {tabs.map((s) => {
                  const Icon = s.icon
                  return (
                    <NavLink key={s.id} to={`/settings/${page}/${s.id}`}
                      className={({ isActive }) => cn("flex w-full items-center gap-3 rounded-lg px-4 py-3 text-start text-sm transition-all",
                        isActive ? "bg-primary font-bold text-primary-foreground" : "font-medium text-[var(--text-main)] hover:bg-primary/10 hover:text-primary")}>
                      <Icon size={18} />
                      <span>{t(`settings.s.${s.id}`)}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          </div>
          <div className="w-full min-w-0 flex-1">{body}</div>
        </div>
      </CardContent>
    </Card>
  )
}
