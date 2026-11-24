import * as Sentry from "@sentry/react"
import { useAuthStore } from "@/shared/auth/authStore"

/**
 * Error monitoring (Sentry, or GlitchTip: only the DSN differs). Off unless VITE_SENTRY_DSN is set,
 * so dev and the mock server never send anything. This ERP holds customer data, so events carry
 * no default PII, no request/response bodies, no headers, cookies or tokens, no query strings,
 * and the user is only an id plus a branch tag.
 * Session replay is the exception, by the owner's decision: only sessions that hit an error are
 * recorded, with page text visible (maskAllText off) but every input masked (maskAllInputs on, so
 * passwords, logins, tokens and typed values never leave) and no network detail capture.
 */
const dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN

export function initMonitoring() {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Breadcrumbs for console / clicks / fetch / xhr can carry typed text and URLs: keep navigation only.
    // In @sentry/react 11 console capture is its own default integration ("Console"), so drop it here.
    integrations: (defaults) => [
      ...defaults.filter((i) => i.name !== "Breadcrumbs" && i.name !== "Console"),
      Sentry.breadcrumbsIntegration({ dom: false, fetch: false, xhr: false, history: true }),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false, maskAllInputs: true }),
    ],
    beforeSend(event) {
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        delete event.request.headers
        delete event.request.query_string
        if (event.request.url) event.request.url = event.request.url.split(/[?#]/)[0]
      }
      event.user = event.user?.id ? { id: event.user.id } : undefined
      return event
    },
  })
  const setUser = (session: ReturnType<typeof useAuthStore.getState>["session"]) => {
    Sentry.setUser(session?.userId ? { id: session.userId } : null)
    Sentry.setTag("branch", session?.branchId ?? null)
  }
  setUser(useAuthStore.getState().session)
  useAuthStore.subscribe((s) => setUser(s.session))
}

/** Report a caught error (route errors, error boundary). No-op without a DSN. */
export function reportError(error: unknown) {
  if (dsn) Sentry.captureException(error)
}

/**
 * Report a failed API call: every failed call except 401 (HTTP errors and no connection). The server's message is left out on
 * purpose, it may quote customer data; only method, route (ids removed) and status are sent.
 */
export function reportApiFailure(method: string, url: string, status: number) {
  if (!dsn) return
  const route = url.split("?")[0].replace(/\/\d+(?=\/|$)/g, "/:id").replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ":id")
  Sentry.captureMessage(`API ${method} ${route} ${status || "network"}`, {
    level: status >= 500 || status === 0 ? "error" : "warning",
    tags: { api_status: status || "network" },
    fingerprint: ["api", method, route, String(status)],
  })
}
