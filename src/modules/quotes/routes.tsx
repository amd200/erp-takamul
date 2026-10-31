import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

export const quoteRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.quotes.view} />, children: [
    { path: "quotes", lazy: lazyPage(() => import("./pages/QuotesPage")) },
  ] },
  { element: <RequirePermission perm={P.quotes.add} />, children: [{ path: "quotes/create", lazy: lazyPage(() => import("./pages/QuoteFormPage")) }] },
  { element: <RequirePermission perm={P.quotes.edit} />, children: [{ path: "quotes/:id/edit", lazy: lazyPage(() => import("./pages/QuoteFormPage")) }] },
]
