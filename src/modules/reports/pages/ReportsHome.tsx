import { NavLink, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/PageHeader"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { REPORTS } from "../definitions"
import { REPORT_CATEGORIES, type ReportCategory } from "../types"
import { ReportLink } from "./ReportPage"

/** Report catalogue, one category at a time (or all of them), filtered by the user's permissions. */
export default function ReportsHome({ category: fixed }: { category?: ReportCategory } = {}) {
  const { t } = useTranslation()
  const params = useParams<{ category?: ReportCategory }>()
  const category = fixed ?? params.category
  const can = useCan()
  const visible = REPORTS.filter((r) => can(r.perm))
  const cats = REPORT_CATEGORIES.filter((c) => visible.some((r) => r.category === c))
  const shown = category ? cats.filter((c) => c === category) : cats

  return (
    <>
      <PageHeader crumbs={[t("nav.reports")]} title={category ? t(`reports.cat.${category}`) : t("reports.title")} description={t("reports.description")} />
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label={t("nav.reports")}>
        <NavLink to="/reports" end className={({ isActive }) => cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-muted", isActive && "bg-secondary font-semibold text-secondary-foreground")}>{t("reports.allCategories")}</NavLink>
        {cats.map((c) => (
          <NavLink key={c} to={`/reports/category/${c}`} className={({ isActive }) => cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-muted", isActive && "bg-secondary font-semibold text-secondary-foreground")}>
            {t(`reports.cat.${c}`)}
          </NavLink>
        ))}
      </nav>
      {shown.map((c) => (
        <section key={c} className="flex flex-col gap-3">
          {!category && <h2 className="text-[15px] font-semibold">{t(`reports.cat.${c}`)}</h2>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.filter((r) => r.category === c).map((r) => <ReportLink key={r.id} def={r} />)}
          </div>
        </section>
      ))}
    </>
  )
}
