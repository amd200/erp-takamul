import type { RouteObject } from "react-router-dom"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { P } from "@/shared/permissions/permissions"
import { lazyPage } from "@/shared/routing/lazyPage"

const invoices = () => import("./pages/InvoicesPage")

/** Everything under the Sales menu. The point-of-sale screens themselves stay in the current system. */
export const salesRoutes: RouteObject[] = [
  { element: <RequirePermission perm={P.sales.view} />, children: [
    { path: "sales/invoices", lazy: lazyPage(invoices, "A4InvoicesPage") },
    { path: "sales/invoices/:id", lazy: lazyPage(() => import("./pages/InvoiceDetailPage")) },
  ] },
  { element: <RequirePermission perm={P.sales.add} />, children: [
    { path: "sales/invoices/create", lazy: lazyPage(() => import("./pages/InvoiceFormPage")) },
  ] },
  { element: <RequirePermission perm={P.sales.pos} />, children: [
    { path: "sales/pos-invoices", lazy: lazyPage(invoices, "PosInvoicesPage") },
  ] },
  { element: <RequirePermission perm={P.sales.returnsView} />, children: [
    { path: "sales/returns", lazy: lazyPage(() => import("./pages/ReturnsPage")) },
    { path: "sales/returns/:id", lazy: lazyPage(() => import("./pages/ReturnViewPage")) },
  ] },
  { element: <RequirePermission perm={P.sales.returnsAdd} />, children: [
    { path: "sales/returns/create", lazy: lazyPage(() => import("./pages/ReturnFormPage")) },
  ] },
  { element: <RequirePermission perm={P.sales.debitView} />, children: [
    { path: "sales/debit-notes", lazy: lazyPage(() => import("./pages/DebitNotesPage")) },
  ] },
  { element: <RequirePermission perm={P.sales.debitAdd} />, children: [
    { path: "sales/debit-notes/create", lazy: lazyPage(() => import("./pages/DebitNoteFormPage")) },
  ] },
]
