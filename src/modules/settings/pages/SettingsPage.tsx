import { useState } from "react"
import { Link, NavLink, Navigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Settings } from "lucide-react"
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
  const [q, setQ] = useState("")
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
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
                          isActive ? "bg-background/80 font-medium text-success max-sm:border-green-500/40 max-sm:bg-green-50 dark:text-green-400" : "text-[var(--text-muted)] hover:bg-background/60 hover:text-foreground")}>
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
        <div className="relative flex flex-col items-stretch gap-4 md:flex-row md:items-start md:gap-8">
          <div className="min-w-0 md:w-64 md:shrink-0">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:sticky md:top-24">
              <div className="hidden items-center gap-3 border-b border-border bg-muted/40 p-4 font-bold text-foreground md:flex">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings size={18} /></span>{t("nav.siteSettings")}
              </div>
              <div className="relative border-b border-border p-2">
                <Search size={16} className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} aria-label={t("common.search")} className="h-10 rounded-xl ps-9" />
              </div>
              <nav aria-label={t("nav.settings")} className="flex gap-1.5 overflow-x-auto p-2 [scrollbar-width:thin] md:max-h-[calc(100vh-18rem)] md:flex-col md:gap-1 md:overflow-y-auto md:overflow-x-hidden">
                {tabs.filter((s) => t(`settings.s.${s.id}`).toLowerCase().includes(q.trim().toLowerCase()) || s.id === tab.id).map((s) => {
                  const Icon = s.icon
                  return (
                    <NavLink key={s.id} to={`/settings/${page}/${s.id}`}
                      className={({ isActive }) => cn("flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-start text-sm whitespace-nowrap transition-all md:w-full md:gap-3 md:py-3",
                        isActive ? "bg-primary font-bold text-primary-foreground shadow-sm" : "font-medium text-foreground hover:bg-primary/10 hover:text-primary")}>
                      <Icon size={18} className="shrink-0" />
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
