import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { cn } from "@/lib/utils"
import { useClassic } from "@/shared/theme/ThemeProvider"

/** One shell for both looks: a sidebar column + header, a drawer on phones. Classic only changes the column width and the page box. */
export function AppLayout() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const classic = useClassic()
  useEffect(() => { setDrawer(false) }, [pathname])

  return (
    <div className={cn("grid min-h-svh grid-cols-1 print:block", classic ? "md:grid-cols-[270px_minmax(0,1fr)]" : "md:grid-cols-[248px_minmax(0,1fr)]")}>
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      <div className="flex min-w-0 flex-col">
        <Topbar drawerOpen={drawer} onMenu={() => setDrawer((o) => !o)} />
        <main className="flex min-w-0 flex-col gap-5 px-4 py-6 md:px-6">
          {/* Classic: a page that opens with a PageHeader sits in the bordered box the current system draws around every page. */}
          <div className={cn("flex min-w-0 flex-col gap-5", classic && "has-[[data-page-header]]:rounded-lg has-[[data-page-header]]:border has-[[data-page-header]]:border-gray-200 has-[[data-page-header]]:p-6 dark:has-[[data-page-header]]:border-zinc-800 print:border-0 print:p-0")}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
