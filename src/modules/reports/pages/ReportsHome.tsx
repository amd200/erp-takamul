import { NavLink, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Users, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { REPORTS } from "../definitions"
import { REPORT_CATEGORIES, type ReportCategory } from "../types"
import { ReportLink } from "./ReportPage"

/** Reports that have no entry in the report definitions; shown as cards after the defined ones. */
const EXTRA_REPORTS: Partial<Record<ReportCategory, { id: string; titleKey: string; icon: typeof Users }[]>> = {
  customers: [{ id: "customer-item-sales", titleKey: "oldReports.customer_item_sales_report", icon: Users }],
  suppliers: [{ id: "supplier-item-purchases", titleKey: "oldReports.supplier_item_purchases_report", icon: History }],
}

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
      <div className="min-w-0">
        <div className="text-xs text-faint">{t("nav.reports")}</div>
        <h1 className="mt-0.5 text-[22px] font-bold text-balance">{category ? t(`reports.cat.${category}`) : t("reports.title")}</h1>
        <p className="mt-0.5 text-muted-foreground">{t("reports.description")}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label={t("nav.reports")}>
        <NavLink to="/reports" end className={({ isActive }) => cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground", isActive && "bg-secondary font-semibold text-secondary-foreground")}>{t("reports.allCategories")}</NavLink>
        {cats.map((c) => (
          <NavLink key={c} to={`/reports/category/${c}`} className={({ isActive }) => cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground", isActive && "bg-secondary font-semibold text-secondary-foreground")}>
            {t(`reports.cat.${c}`)}
          </NavLink>
        ))}
      </nav>
      {shown.map((c) => (
        <section key={c} className="flex flex-col gap-3">
          {!category && <h2 className="text-[15px] font-semibold">{t(`reports.cat.${c}`)}</h2>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.filter((r) => r.category === c).map((r) => <ReportLink key={r.id} def={r} />)}
            {(EXTRA_REPORTS[c] ?? []).map(({ id, titleKey, icon: Icon }) => (
              <Link key={id} to={`/reports/${id}`} className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-primary">{t(titleKey)}</span>
                  <span className="block text-sm text-muted-foreground">{t(`reports.d.${id}`)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
