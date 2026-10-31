import { createElement, type ComponentType } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Barcode, Calendar, FileText, RefreshCw, RotateCcw, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

type Card = { title: string; icon: ComponentType<{ className?: string }>; path: string }

/** The sales reports as cards: the report's name and icon, and a button that opens it. */
export default function SalesReportsCategory() {
  const { t } = useTranslation()
  const reports: Card[] = [
    { title: t("oldReports.net_sales_report"), icon: FileText, path: "/reports/net-sales" },
    { title: t("oldReports.sales_by_invoice"), icon: FileText, path: "/reports/sales-by-invoice" },
    { title: t("oldReports.sales_by_day"), icon: Calendar, path: "/reports/sales-by-day" },
    { title: t("oldReports.item_sales_report"), icon: Barcode, path: "/reports/item-sales" },
    { title: t("oldReports.products_sales_report"), icon: Barcode, path: "/reports/products-sales" },
    { title: t("oldReports.shifts_report"), icon: RefreshCw, path: "/reports/shifts" },
    { title: t("oldReports.sales_returns_report"), icon: RotateCcw, path: "/reports/sales-returns" },
    { title: t("oldReports.employee_sales_report"), icon: Users, path: "/reports/employee-sales" },
  ]
  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div className="rounded bg-primary p-1.5 text-white"><BarChart3 size={18} /></div>
          <h1 className="text-xl font-bold">{t("oldReports.sales_reports")}</h1>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reports.map((r) => (
            <div key={r.path} className="group flex flex-col items-center overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
              <div className="mb-4 flex w-full items-center justify-between">
                <div className="h-4 w-1 rounded-full bg-primary" />
                <span className="text-sm font-semibold transition-colors group-hover:text-primary">{r.title}</span>
              </div>
              <div className="flex flex-1 items-center justify-center py-6 text-primary transition-transform duration-300 group-hover:scale-110">{createElement(r.icon, { className: "size-12" })}</div>
              <Link to={r.path} className="mt-4 w-full rounded-lg bg-primary py-2.5 text-center text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-95">{t("oldReports.view_report")}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
