import { createBrowserRouter } from "react-router-dom"
import { itemRoutes } from "@/modules/products/routes"
import { salesRoutes } from "@/modules/sales/routes"
import { userRoutes } from "@/modules/users/routes"
import { settingsRoutes } from "@/modules/settings/routes"
import { reportRoutes } from "@/modules/reports/routes"
import { partnerRoutes } from "@/modules/partners/routes"
import { shiftRoutes } from "@/modules/shifts/routes"
import { quoteRoutes } from "@/modules/quotes/routes"
import { purchaseRoutes, purchaseScreenRoutes } from "@/modules/purchases/routes"
import { branchRoutes } from "@/modules/branches/routes"
import { warehouseRoutes } from "@/modules/warehouses/routes"
import { reservationRoutes } from "@/modules/reservations/routes"
import { orderRequestRoutes } from "@/modules/order-requests/routes"
import { pos4Routes, posRoutes } from "@/modules/pos/routes"
import { expenseRoutes } from "@/modules/expenses/routes"
import { publicInvoiceRoutes } from "@/modules/public-invoice/routes"
import { authRoutes } from "@/modules/auth/routes"
import { RequireAuth } from "@/modules/auth/components/AuthGate"
import { AppLayout } from "./layout/AppLayout"
import { NotBuiltPage } from "./pages"
import { HomePage } from "@/modules/home/pages/HomePage"

export const router = createBrowserRouter([
  ...authRoutes,
  ...pos4Routes,
  ...publicInvoiceRoutes,
  {
    element: <RequireAuth />,
    children: [...posRoutes, ...purchaseScreenRoutes, {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      ...itemRoutes,
      ...salesRoutes,
      ...userRoutes,
      ...partnerRoutes,
      ...shiftRoutes,
      ...quoteRoutes,
      ...purchaseRoutes,
      ...branchRoutes,
      ...warehouseRoutes,
      ...reservationRoutes,
      ...orderRequestRoutes,
      ...expenseRoutes,
      ...reportRoutes,
      ...settingsRoutes,
      { path: "*", element: <NotBuiltPage /> },
    ],
  }],
  },
])
