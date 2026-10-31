import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

/** Everything under the Users menu: users, roles, POS devices, certificates, employees. */
export const userRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.users.view} />, children: [
    { path: "users", lazy: lazyPage(() => import("./pages/UsersPage")) },
  ] },
  { element: <RequirePermission perm={P.roles.view} />, children: [
    { path: "roles", lazy: lazyPage(() => import("@/modules/roles/pages/RolesPage")) },
  ] },
  { element: <RequirePermission perm={P.roles.manage} />, children: [
    { path: "roles/create", lazy: lazyPage(() => import("@/modules/roles/pages/RoleFormPage")) },
    { path: "roles/:id", lazy: lazyPage(() => import("@/modules/roles/pages/RoleFormPage")) },
  ] },
  { element: <RequirePermission perm={P.posDevices.view} />, children: [
    { path: "pos-devices", lazy: lazyPage(() => import("@/modules/pos-devices/pages/DevicesPage")) },
  ] },
  { element: <RequirePermission perm={P.certificates.view} />, children: [
    { path: "certificates", lazy: lazyPage(() => import("@/modules/pos-devices/pages/CertificatesPage")) },
  ] },
  { element: <RequirePermission perm={P.employees.view} />, children: [
    { path: "employees", lazy: lazyPage(() => import("@/modules/employees/pages/EmployeesPage")) },
  ] },
]
