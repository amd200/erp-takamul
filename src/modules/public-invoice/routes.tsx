import type { RouteObject } from "react-router-dom"
import { lazyPage } from "@/shared/routing/lazyPage"

/** The customer's tracking page (opened from the store's QR or from the push notification) needs no sign-in. */
export const publicInvoiceRoutes: RouteObject[] = [
  { path: "qr", lazy: lazyPage(() => import("./pages/LastInvoicePage")) },
]
