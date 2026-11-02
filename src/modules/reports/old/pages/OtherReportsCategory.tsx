import { AlertTriangle, BarChart3, Barcode, Calendar, FileText, History, TrendingUp, Users, Wallet } from "lucide-react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CategoryCards, type CategoryCard } from "../CategoryCards"

/** The report categories other than sales, as cards (`/reports/category/:category`). */
export default function OtherReportsCategory() {
  const { t } = useTranslation()
  const category = useLocation().pathname.split("/").pop()
  const o = (k: string) => t(`oldReports.${k}`)
  const sets: Record<string, { title: string; reports: CategoryCard[] }> = {
    items: { title: o("item_reports"), reports: [
      { title: o("top_selling_product_report"), icon: TrendingUp, path: "/reports/best-sellers" },
      { title: o("item_movement_report"), icon: FileText, path: "/reports/item-movement" },
      { title: o("stock_alerts_report"), icon: AlertTriangle, path: "/reports/low-stock" },
      { title: o("stock_balance_report"), icon: BarChart3, path: "/reports/stock-balance" },
    ] },
    purchases: { title: o("purchase_reports"), reports: [
      { title: o("purchases_by_invoice"), icon: FileText, path: "/reports/purchases-by-invoice" },
      { title: o("purchases_by_day"), icon: Calendar, path: "/reports/purchases-by-day" },
      { title: o("products_purchases_report"), icon: Barcode, path: "/reports/products-purchases" },
      { title: o("item_purchases_report"), icon: Barcode, path: "/reports/item-purchases" },
    ] },
    customers: { title: o("customer_reports"), reports: [
      { title: o("customer_account_statement"), icon: Users, path: "/reports/customer-statement" },
      { title: o("customer_item_sales_report"), icon: Users, path: "/reports/customer-item-sales" },
    ] },
    suppliers: { title: o("suppliers_reports"), reports: [
      { title: o("supplier_statement"), icon: History, path: "/reports/supplier-statement" },
      { title: o("supplier_item_purchases_report"), icon: History, path: "/reports/supplier-item-purchases" },
    ] },
    expenses: { title: o("expenses_reports"), reports: [{ title: o("expenses_report"), icon: Wallet, path: "/reports/expenses-detail" }] },
    profits: { title: o("profits_reports"), reports: [{ title: o("profit_report"), icon: TrendingUp, path: "/reports/profit" }] },
  }
  const set = sets[category ?? ""]
  return set ? <CategoryCards title={set.title} reports={set.reports} /> : null
}
