import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export function AppLayout() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setDrawer(false) }, [pathname])

  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)] print:block">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      <div className="flex min-w-0 flex-col">
        <Topbar onMenu={() => setDrawer((o) => !o)} />
        <main className="flex min-w-0 flex-col gap-5 px-4 py-6 md:px-6">
          {/* A page that opens with a PageHeader sits in the bordered box the system draws around every page. */}
          <div className="flex min-w-0 flex-col gap-5 has-[[data-page-header]]:rounded-lg has-[[data-page-header]]:border has-[[data-page-header]]:border-gray-200 has-[[data-page-header]]:p-6 dark:has-[[data-page-header]]:border-zinc-800 print:border-0 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
