import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"
import ReportsHome from "./pages/ReportsHome"
import type { ReportCategory } from "./types"

/** One category of the report catalogue (the route has no `:category` param, so the page gets it as a prop). */
const categoryPage = (category: ReportCategory) => {
  const Page = () => <ReportsHome category={category} />
  return () => Promise.resolve({ Component: Page })
}

/** Report catalogue and the single report page; each report checks its own category permission. */
export const reportRoutes: RouteObject[] = [
  { element: <RequirePermission perm={Object.values(P.reports)} />, children: [
    { path: "reports", lazy: lazyPage(() => import("./pages/ReportsHome")) },
    { path: "reports/:id", lazy: lazyPage(() => import("./pages/ReportPage")) },
  ] },
  // The sales reports, laid out as in the current system; they take precedence over the generic `reports/:id`.
  { element: <RequirePermission perm={P.reports.sales} />, children: [
    { path: "reports/category/sales", lazy: categoryPage("sales") },
    { path: "reports/net-sales", lazy: lazyPage(() => import("./old/pages/NetSalesReport")) },
    { path: "reports/sales-by-invoice", lazy: lazyPage(() => import("./old/pages/SalesByInvoiceReport")) },
    { path: "reports/sales-by-day", lazy: lazyPage(() => import("./old/pages/SalesByDayReport")) },
    { path: "reports/item-sales", lazy: lazyPage(() => import("./old/pages/ItemSalesReport")) },
    { path: "reports/products-sales", lazy: lazyPage(() => import("./old/pages/ProductsSalesReport")) },
    { path: "reports/sales-returns", lazy: lazyPage(() => import("./old/pages/SalesReturnsReport")) },
    { path: "reports/shifts", lazy: lazyPage(() => import("./old/pages/ShiftsReport")) },
    { path: "reports/employee-sales", lazy: lazyPage(() => import("./old/pages/EmployeeSalesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.items} />, children: [
    { path: "reports/category/items", lazy: categoryPage("items") },
    { path: "reports/best-sellers", lazy: lazyPage(() => import("./old/pages/BestSellersReport")) },
    { path: "reports/item-movement", lazy: lazyPage(() => import("./old/pages/ItemMovementReport")) },
    { path: "reports/low-stock", lazy: lazyPage(() => import("./old/pages/LowStockReport")) },
    { path: "reports/stock-balance", lazy: lazyPage(() => import("./old/pages/StockBalanceReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.purchases} />, children: [
    { path: "reports/category/purchases", lazy: categoryPage("purchases") },
    { path: "reports/purchases-by-invoice", lazy: lazyPage(() => import("./old/pages/PurchasesByInvoiceReport")) },
    { path: "reports/purchases-by-day", lazy: lazyPage(() => import("./old/pages/PurchasesByDayReport")) },
    { path: "reports/products-purchases", lazy: lazyPage(() => import("./old/pages/ProductsPurchasesReport")) },
    { path: "reports/item-purchases", lazy: lazyPage(() => import("./old/pages/ItemPurchasesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.customers} />, children: [
    { path: "reports/category/customers", lazy: categoryPage("customers") },
    { path: "reports/customer-statement", lazy: lazyPage(() => import("./old/pages/CustomerStatementReport")) },
    { path: "reports/customer-item-sales", lazy: lazyPage(() => import("./old/pages/CustomerItemSalesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.suppliers} />, children: [
    { path: "reports/category/suppliers", lazy: categoryPage("suppliers") },
    { path: "reports/supplier-statement", lazy: lazyPage(() => import("./old/pages/SupplierStatementReport")) },
    { path: "reports/supplier-item-purchases", lazy: lazyPage(() => import("./old/pages/SupplierItemPurchasesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.expenses} />, children: [
    { path: "reports/category/expenses", lazy: categoryPage("expenses") },
    { path: "reports/expenses-detail", lazy: lazyPage(() => import("./old/pages/ExpensesDetailReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.profits} />, children: [
    { path: "reports/category/profits", lazy: categoryPage("profits") },
    { path: "reports/profit", lazy: lazyPage(() => import("./old/pages/ProfitReport")) },
  ] },
]
