import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const orderRequestRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.orderRequests.view} />, children: [{ path: "orders", lazy: lazyPage(() => import("./pages/OrderRequestsPage")) }] },
]
