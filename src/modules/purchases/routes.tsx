import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const purchaseRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.purchases.view} />, children: [
    { path: "purchases", lazy: lazyPage(() => import("./pages/PurchasesPage")) },
    { path: "purchases/:id", lazy: lazyPage(() => import("./pages/PurchaseViewPage")) },
  ] },
  { element: <RequirePermission perm={P.purchases.add} />, children: [{ path: "purchases/create", lazy: lazyPage(() => import("./pages/PurchaseFormPage")) }] },
  { element: <RequirePermission perm={P.purchases.edit} />, children: [{ path: "purchases/:id/edit", lazy: lazyPage(() => import("./pages/PurchaseFormPage")) }] },
]

/** The full-screen purchases screen sits outside the back-office layout, like the cashier. */
export const purchaseScreenRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.purchases.add} />, children: [{ path: "pos3", lazy: lazyPage(() => import("./pages/PurchaseScreenPage")) }] },
]
