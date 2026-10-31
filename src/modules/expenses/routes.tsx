import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const expenseRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.expenses.view} />, children: [{ path: "expenses", lazy: lazyPage(() => import("./pages/ExpensesPage")) }] },
  { element: <RequirePermission perm={P.expenseItems.view} />, children: [{ path: "expenses/items", lazy: lazyPage(() => import("./pages/ExpenseItemsPage")) }] },
]
