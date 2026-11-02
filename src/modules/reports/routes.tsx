import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"
import { themedCategory, themedReport } from "./themed"

/** Report catalogue and the single report page; each report checks its own category permission. */
export const reportRoutes: RouteObject[] = [
  { element: <RequirePermission perm={Object.values(P.reports)} />, children: [
    { path: "reports", lazy: lazyPage(() => import("./pages/ReportsHome")) },
    { path: "reports/:id", lazy: lazyPage(() => import("./pages/ReportPage")) },
  ] },
  // The sales reports, laid out as in the current system; they take precedence over the generic `reports/:id`.
  { element: <RequirePermission perm={P.reports.sales} />, children: [
    { path: "reports/category/sales", lazy: themedCategory("sales") },
    { path: "reports/net-sales", lazy: themedReport("net-sales", () => import("./old/pages/NetSalesReport")) },
    { path: "reports/sales-by-invoice", lazy: themedReport("sales-by-invoice", () => import("./old/pages/SalesByInvoiceReport")) },
    { path: "reports/sales-by-day", lazy: themedReport("sales-by-day", () => import("./old/pages/SalesByDayReport")) },
    { path: "reports/item-sales", lazy: themedReport("item-sales", () => import("./old/pages/ItemSalesReport")) },
    { path: "reports/products-sales", lazy: themedReport("products-sales", () => import("./old/pages/ProductsSalesReport")) },
    { path: "reports/sales-returns", lazy: themedReport("sales-returns", () => import("./old/pages/SalesReturnsReport")) },
    { path: "reports/shifts", lazy: lazyPage(() => import("./old/pages/ShiftsReport")) },
    { path: "reports/employee-sales", lazy: themedReport("employee-sales", () => import("./old/pages/EmployeeSalesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.items} />, children: [
    { path: "reports/category/items", lazy: themedCategory("items") },
    { path: "reports/best-sellers", lazy: themedReport("best-sellers", () => import("./old/pages/BestSellersReport")) },
    { path: "reports/item-movement", lazy: themedReport("item-movement", () => import("./old/pages/ItemMovementReport")) },
    { path: "reports/low-stock", lazy: themedReport("low-stock", () => import("./old/pages/LowStockReport")) },
    { path: "reports/stock-balance", lazy: themedReport("stock-balance", () => import("./old/pages/StockBalanceReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.purchases} />, children: [
    { path: "reports/category/purchases", lazy: themedCategory("purchases") },
    { path: "reports/purchases-by-invoice", lazy: themedReport("purchases-by-invoice", () => import("./old/pages/PurchasesByInvoiceReport")) },
    { path: "reports/purchases-by-day", lazy: themedReport("purchases-by-day", () => import("./old/pages/PurchasesByDayReport")) },
    { path: "reports/products-purchases", lazy: themedReport("products-purchases", () => import("./old/pages/ProductsPurchasesReport")) },
    { path: "reports/item-purchases", lazy: themedReport("item-purchases", () => import("./old/pages/ItemPurchasesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.customers} />, children: [
    { path: "reports/category/customers", lazy: themedCategory("customers") },
    { path: "reports/customer-statement", lazy: themedReport("customer-statement", () => import("./old/pages/CustomerStatementReport")) },
    { path: "reports/customer-item-sales", lazy: lazyPage(() => import("./old/pages/CustomerItemSalesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.suppliers} />, children: [
    { path: "reports/category/suppliers", lazy: themedCategory("suppliers") },
    { path: "reports/supplier-statement", lazy: themedReport("supplier-statement", () => import("./old/pages/SupplierStatementReport")) },
    { path: "reports/supplier-item-purchases", lazy: lazyPage(() => import("./old/pages/SupplierItemPurchasesReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.expenses} />, children: [
    { path: "reports/category/expenses", lazy: themedCategory("expenses") },
    { path: "reports/expenses-detail", lazy: themedReport("expenses-detail", () => import("./old/pages/ExpensesDetailReport")) },
  ] },
  { element: <RequirePermission perm={P.reports.profits} />, children: [
    { path: "reports/category/profits", lazy: themedCategory("profits") },
    { path: "reports/profit", lazy: themedReport("profit", () => import("./old/pages/ProfitReport")) },
  ] },
]
