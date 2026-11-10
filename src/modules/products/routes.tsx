import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"

const page = (load: () => Promise<{ default: React.ComponentType }>) => () => load().then((m) => ({ Component: m.default }))

/** Everything under the Items menu: items, stock adjustments, barcodes, categories, units, additions. */
export const itemRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.products.view} />, children: [
    { path: "products", lazy: page(() => import("./pages/ProductsListPage")) },
  ] },
  { element: <RequirePermission perm={P.products.add} />, children: [
    { path: "products/create", lazy: page(() => import("./pages/ProductFormPage")) },
  ] },
  { element: <RequirePermission perm={P.products.edit} />, children: [
    { path: "products/edit/:id", lazy: page(() => import("./pages/ProductFormPage")) },
  ] },
  { element: <RequirePermission perm={P.products.import} />, children: [
    { path: "products/import", lazy: page(() => import("./pages/ImportProductsPage")) },
  ] },
  { element: <RequirePermission perm={P.barcode.print} />, children: [
    { path: "products/barcode", lazy: page(() => import("@/modules/barcode/pages/BarcodePrintPage")) },
  ] },
  { element: <RequirePermission perm={P.stock.view} />, children: [
    { path: "products/quantity-adjustments", lazy: page(() => import("@/modules/stock-adjustments/pages/AdjustmentsPage")) },
    { path: "products/quantity-adjustments/view/:id", lazy: page(() => import("@/modules/stock-adjustments/pages/AdjustmentFormPage")) },
  ] },
  { element: <RequirePermission perm={P.stock.adjust} />, children: [
    { path: "products/quantity-adjustments/create", lazy: page(() => import("@/modules/stock-adjustments/pages/AdjustmentFormPage")) },
    { path: "products/quantity-adjustments/edit/:id", lazy: page(() => import("@/modules/stock-adjustments/pages/AdjustmentFormPage")) },
  ] },
  { element: <RequirePermission perm={P.categories.view} />, children: [
    { path: "products/groups", lazy: page(() => import("@/modules/categories/pages/CategoriesPage")) },
  ] },
  { element: <RequirePermission perm={P.units.view} />, children: [
    { path: "products/units", lazy: page(() => import("@/modules/units/pages/UnitsPage")) },
  ] },
  { element: <RequirePermission perm={P.additions.view} />, children: [
    { path: "products/additions", lazy: page(() => import("@/modules/additions/pages/AdditionsPage")) },
  ] },
]
