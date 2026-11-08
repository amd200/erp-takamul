import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export function AppLayout() {
  return (
    <SidebarProvider className="print:block">
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <Topbar />
        <div className="flex min-w-0 flex-col gap-5 px-4 py-6 md:px-6">
          {/* A page that opens with a PageHeader sits in the bordered box the system draws around every page. */}
          <div className="flex min-w-0 flex-col gap-5 has-[[data-page-header]]:rounded-lg has-[[data-page-header]]:border has-[[data-page-header]]:border-gray-200 has-[[data-page-header]]:p-6 dark:has-[[data-page-header]]:border-zinc-800 print:border-0 print:p-0">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
