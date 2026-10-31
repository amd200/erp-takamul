import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const reservationRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.reservations.view} />, children: [{ path: "reservations", lazy: lazyPage(() => import("./pages/ReservationsPage")) }] },
]
