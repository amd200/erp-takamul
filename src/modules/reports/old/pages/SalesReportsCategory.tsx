import type { ComponentType } from "react"
import { Barcode, Calendar, FileText, RefreshCw, RotateCcw, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CategoryCards } from "../CategoryCards"

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
  return <CategoryCards title={t("oldReports.sales_reports")} reports={reports} />
}
