import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

/** Report catalogue and the single report page; each report checks its own category permission. */
export const reportRoutes: RouteObject[] = [
  { element: <RequirePermission perm={Object.values(P.reports)} />, children: [
    { path: "reports", lazy: lazyPage(() => import("./pages/ReportsHome")) },
    { path: "reports/category/:category", lazy: lazyPage(() => import("./pages/ReportsHome")) },
    { path: "reports/:id", lazy: lazyPage(() => import("./pages/ReportPage")) },
  ] },
  // The sales reports, laid out as in the current system; they take precedence over the generic `reports/:id`.
  { element: <RequirePermission perm={P.reports.sales} />, children: [
    { path: "reports/category/sales", lazy: lazyPage(() => import("./old/pages/SalesReportsCategory")) },
    { path: "reports/net-sales", lazy: lazyPage(() => import("./old/pages/NetSalesReport")) },
    { path: "reports/sales-by-invoice", lazy: lazyPage(() => import("./old/pages/SalesByInvoiceReport")) },
    { path: "reports/sales-by-day", lazy: lazyPage(() => import("./old/pages/SalesByDayReport")) },
    { path: "reports/item-sales", lazy: lazyPage(() => import("./old/pages/ItemSalesReport")) },
    { path: "reports/products-sales", lazy: lazyPage(() => import("./old/pages/ProductsSalesReport")) },
    { path: "reports/sales-returns", lazy: lazyPage(() => import("./old/pages/SalesReturnsReport")) },
    { path: "reports/employee-sales", lazy: lazyPage(() => import("./old/pages/EmployeeSalesReport")) },
  ] },
]
