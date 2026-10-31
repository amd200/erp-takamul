import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const shiftRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.shifts.view} />, children: [{ path: "shifts", lazy: lazyPage(() => import("./pages/ShiftsPage")) }] },
]
