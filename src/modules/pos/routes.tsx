import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

/** The customer's own ordering screen needs no sign-in: the server hands out the menu and takes the order without one. */
export const pos4Routes: RouteObject[] = [
  { path: "pos4", lazy: lazyPage(() => import("./pages/Pos4Page")) },
]

/** The cashier screens fill the whole window, so they sit outside the back-office layout. */
export const posRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.sales.pos} />, children: [
    { path: "pos", lazy: lazyPage(() => import("./pages/PosPage")) },
    { path: "pos2", lazy: lazyPage(() => import("./pages/Pos2Page")) },
    { path: "pos-optics", lazy: lazyPage(() => import("./pages/PosOpticsPage")) },
    // The tailoring shop's order screen: look only for now, on sample data (the back end has no tailoring data yet).
    { path: "pos-tailoring", lazy: lazyPage(() => import("@/modules/tailoring/pages/TailoringPosPage")) },
  ] },
  // The kitchen screen belongs with the cashier screens: full window, no back-office menu.
  { element: <RequirePermission perm={P.sales.view} />, children: [
    { path: "pos/preparation", lazy: lazyPage(() => import("@/modules/preparation/pages/PreparationPage")) },
  ] },
]
