import { type ComponentType } from "react"
import { Link, NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/PageHeader"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"

export type CategoryCard = { title: string; icon: ComponentType<{ className?: string }>; path: string }

const CATEGORIES = [
  { key: "sales", perm: P.reports.sales, label: "sales_reports" },
  { key: "items", perm: P.reports.items, label: "item_reports" },
  { key: "purchases", perm: P.reports.purchases, label: "purchase_reports" },
  { key: "customers", perm: P.reports.customers, label: "customer_reports" },
  { key: "suppliers", perm: P.reports.suppliers, label: "suppliers_reports" },
  { key: "expenses", perm: P.reports.expenses, label: "expenses_reports" },
  { key: "profits", perm: P.reports.profits, label: "profits_reports" },
] as const

const pill = ({ isActive }: { isActive: boolean }) =>
  cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:bg-muted", isActive && "bg-secondary font-semibold text-secondary-foreground")

/** A report category in the modern layout (title, category tabs, report cards) with the classic colours. */
export function CategoryCards({ title, reports }: { title: string; reports: CategoryCard[] }) {
  const { t } = useTranslation()
  const can = useCan()
  return (
    <>
      <PageHeader title={title} />
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label={t("nav.reports")}>
        {CATEGORIES.filter((c) => can(c.perm)).map((c) => (
          <NavLink key={c.key} to={`/reports/category/${c.key}`} className={pill}>{t(`oldReports.${c.label}`)}</NavLink>
        ))}
      </nav>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.path} to={r.path} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><r.icon className="size-5" /></span>
            <span className="font-semibold group-hover:text-primary">{r.title}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
