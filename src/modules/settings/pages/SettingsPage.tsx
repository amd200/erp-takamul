import { useState } from "react"
import { Link, NavLink, Navigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Site settings, in the erpv2-modern page structure: header with breadcrumb above, a sticky section menu beside a card.
  const shown = tabs.filter((s) => s.id === tab.id || t(`settings.s.${s.id}`).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-faint">{t("nav.home")} / {t("nav.settings")}</div>
          <h1 className="mt-0.5 text-[22px] font-bold text-balance">{t("nav.siteSettings")}</h1>
        </div>
        <Button asChild variant="outline"><Link to="/">{t("sales.cancelBack")}<ArrowLeft size={16} /></Link></Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <Card size="sm" className="gap-2">
            <CardContent className="flex flex-col gap-2">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} aria-label={t("common.search")} className="h-10 ps-9" />
              </div>
              <nav aria-label={t("nav.settings")} className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] lg:max-h-[calc(100vh-14rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
                {shown.map((s) => {
                  const Icon = s.icon
                  return (
                    <NavLink key={s.id} to={`/settings/${page}/${s.id}`}
                      className={({ isActive }) => cn("flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm whitespace-nowrap transition-colors lg:w-full",
                        isActive ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                      <Icon size={16} className="shrink-0" />
                      <span>{t(`settings.s.${s.id}`)}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>
        <div className="min-w-0">{body}</div>
      </div>
    </div>
  )
}
