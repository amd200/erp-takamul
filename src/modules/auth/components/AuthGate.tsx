import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/shared/auth/authStore"
import { authApi } from "../service"

let restoring = false

/**
 * Wraps the app: on first load it tries to restore the session from the refresh cookie, then
 * lets signed-in users through and sends everyone else to /login (remembering where they were going).
 */
export function RequireAuth() {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const signedIn = useAuthStore((s) => !!s.session)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => {
    if (initialized || restoring) return
    restoring = true
    authApi.restore().finally(() => { restoring = false })
  }, [initialized])

  if (!initialized) {
    return (
      <div className="grid min-h-svh place-items-center text-muted-foreground" role="status">
        <span className="flex items-center gap-2"><Loader2 className="animate-spin" />{t("auth.restoring")}</span>
      </div>
    )
  }
  if (!signedIn) return <Navigate to="/login" replace state={{ from: pathname + search }} />
  return <Outlet />
}

/** The sign-in pages bounce signed-in users to the app. */
export function GuestOnly() {
  const signedIn = useAuthStore((s) => !!s.session)
  return signedIn ? <Navigate to="/" replace /> : <Outlet />
}
