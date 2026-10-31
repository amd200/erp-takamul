import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

/** Customers, suppliers, vouchers and treasuries: the money-in, money-out side of the menu. */
export const partnerRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.customers.view} />, children: [{ path: "customers", lazy: lazyPage(() => import("@/modules/customers/pages/CustomersPage")) }] },
  { element: <RequirePermission perm={P.suppliers.view} />, children: [{ path: "suppliers", lazy: lazyPage(() => import("@/modules/suppliers/pages/SuppliersPage")) }] },
  { element: <RequirePermission perm={P.vouchers.receipts} />, children: [{ path: "vouchers/receipts", lazy: lazyPage(() => import("@/modules/vouchers/pages/VouchersPage"), "ReceiptsPage") }] },
  { element: <RequirePermission perm={P.vouchers.payments} />, children: [{ path: "vouchers/payments", lazy: lazyPage(() => import("@/modules/vouchers/pages/VouchersPage"), "PaymentsPage") }] },
  { element: <RequirePermission perm={P.treasuries.view} />, children: [{ path: "treasuries", lazy: lazyPage(() => import("@/modules/treasuries/pages/TreasuriesPage")) }] },
  { element: <RequirePermission perm={P.treasuries.statement} />, children: [{ path: "treasuries/statement", lazy: lazyPage(() => import("@/modules/treasuries/pages/TreasuryStatementPage")) }] },
  { element: <RequirePermission perm={P.treasuries.transfers} />, children: [{ path: "treasuries/transfers", lazy: lazyPage(() => import("@/modules/treasuries/pages/TransfersPage")) }] },
]
