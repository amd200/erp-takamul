import { lazy, Suspense, type ComponentType } from "react"
import { useClassic } from "@/shared/theme/ThemeProvider"
import ReportsHome from "./pages/ReportsHome"
import { ReportById } from "./pages/ReportPage"
import type { ReportCategory } from "./types"

type Load = () => Promise<{ default: ComponentType }>

/** A report route: the classic look keeps the current system's page, the modern look uses the shared report engine (title, filter card, tiles, table). */
export const themedReport = (id: string, old: Load) => {
  const Old = lazy(old)
  const Page = () => (useClassic() ? <Suspense fallback={null}><Old /></Suspense> : <ReportById id={id} />)
  return () => Promise.resolve({ Component: Page })
}

/** A report category route, themed the same way. */
export const themedCategory = (category: string, old: Load) => {
  const Old = lazy(old)
  const Page = () => (useClassic() ? <Suspense fallback={null}><Old /></Suspense> : <ReportsHome category={category as ReportCategory} />)
  return () => Promise.resolve({ Component: Page })
}
