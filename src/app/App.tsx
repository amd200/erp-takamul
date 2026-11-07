import { lazy, Suspense } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { Direction } from "radix-ui"
import { useTranslation } from "react-i18next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/shared/theme/ThemeProvider"
import { router } from "./router"

// Payment-failure simulator for testing: always in dev; on a built app only after opening a link with ?sim=1 (remembered for the tab).
const simEnabled = () => {
  if (import.meta.env.DEV) return true
  try {
    if (new URLSearchParams(location.search).get("sim") === "1") sessionStorage.setItem("pos-sim", "1")
    return sessionStorage.getItem("pos-sim") === "1"
  } catch { return false }
}
const PosSimPanel = simEnabled() ? lazy(() => import("@/shared/dev/PosSimPanel").then((m) => ({ default: m.PosSimPanel }))) : null

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } })

export function App() {
  const { i18n } = useTranslation()
  const dir = i18n.dir()
  return (
    <ThemeProvider>
      <Direction.Provider dir={dir}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={300}>
            <RouterProvider router={router} />
            {PosSimPanel && <Suspense fallback={null}><PosSimPanel /></Suspense>}
            <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} />
          </TooltipProvider>
        </QueryClientProvider>
      </Direction.Provider>
    </ThemeProvider>
  )
}
