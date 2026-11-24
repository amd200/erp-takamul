import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@/shared/i18n"
import * as Sentry from "@sentry/react"
import { App } from "@/app/App"
import { ErrorFallback } from "@/shared/monitoring/ErrorFallback"
import { reloadOnce } from "@/shared/monitoring/chunkReload"
import { initMonitoring } from "@/shared/monitoring/sentry"

initMonitoring()

// After a new deploy old hashed chunks vanish: reload silently to get the new build
window.addEventListener("vite:preloadError", (event) => {
  if (reloadOnce()) event.preventDefault()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
