import type { RouteObject } from "react-router-dom"
import { lazyPage } from "@/shared/routing/lazyPage"
import { GuestOnly } from "./components/AuthGate"

/** Sign-in pages live outside the app layout (no sidebar). */
export const authRoutes: RouteObject[] = [
  { element: <GuestOnly />, children: [
    { path: "login", lazy: lazyPage(() => import("./pages/LoginPage")) },
    { path: "forgot-password", lazy: lazyPage(() => import("./pages/ForgotPasswordPage")) },
    { path: "verify-otp", lazy: lazyPage(() => import("./pages/VerifyOtpPage")) },
    { path: "reset-password", lazy: lazyPage(() => import("./pages/ResetPasswordPage")) },
  ] },
]
