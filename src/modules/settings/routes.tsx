import { Navigate, type RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { ALL_PERMISSIONS } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

const settingsPerms = ALL_PERMISSIONS.filter((p) => p.startsWith("settings."))

/** Two pages, /settings/sales and /settings/system, each opening on its first tab; anyone who can edit a section may open them, the rest show read-only. */
export const settingsRoutes: RouteObject[] = [
  { element: <RequirePermission perm={settingsPerms} />, children: [
    { path: "settings", element: <Navigate to="/settings/sales" replace /> },
    { path: "settings/:group", lazy: lazyPage(() => import("./pages/SettingsPage")) },
    { path: "settings/:group/:section", lazy: lazyPage(() => import("./pages/SettingsPage")) },
  ] },
]
