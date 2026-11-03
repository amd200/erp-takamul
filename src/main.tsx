import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@/shared/i18n"
import { App } from "@/app/App"

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
    <App />
  </StrictMode>,
)
