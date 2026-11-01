import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const branchRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.branches.view} />, children: [{ path: "branches", lazy: lazyPage(() => import("./pages/BranchesPage")) }] },
  { element: <RequirePermission perm={P.branches.add} />, children: [{ path: "branches/create", lazy: lazyPage(() => import("./pages/BranchFormPage")) }] },
  { element: <RequirePermission perm={P.branches.view} />, children: [{ path: "branches/:id/view", lazy: lazyPage(() => import("./pages/BranchFormPage")) }] },
  { element: <RequirePermission perm={P.branches.edit} />, children: [{ path: "branches/:id/edit", lazy: lazyPage(() => import("./pages/BranchFormPage")) }] },
]
