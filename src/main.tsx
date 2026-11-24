import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@/shared/i18n"
import * as Sentry from "@sentry/react"
import { App } from "@/app/App"
import { ErrorFallback } from "@/shared/monitoring/ErrorFallback"
import { initMonitoring } from "@/shared/monitoring/sentry"

initMonitoring()

// After a new deploy old hashed chunks vanish: reload once to get the new build
window.addEventListener("vite:preloadError", () => {
  try {
    if (sessionStorage.getItem("chunk-reloaded")) return
    sessionStorage.setItem("chunk-reloaded", "1")
  } catch { /* ignore */ }
  window.location.reload()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
