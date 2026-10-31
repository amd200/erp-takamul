import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const warehouseRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.warehouses.view} />, children: [{ path: "warehouses", lazy: lazyPage(() => import("./pages/WarehousesPage")) }] },
]
