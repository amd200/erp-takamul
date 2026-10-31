import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { Direction } from "radix-ui"
import { useTranslation } from "react-i18next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/shared/theme/ThemeProvider"
import { router } from "./router"

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
            <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} />
          </TooltipProvider>
        </QueryClientProvider>
      </Direction.Provider>
    </ThemeProvider>
  )
}
