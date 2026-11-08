import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Logo } from "@/components/Logo"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { useAppSettings } from "@/modules/settings"
import { NAV, type NavItem } from "./nav"

function isUnder(pathname: string, to: string) {
  return pathname === to || (pathname.startsWith(to + "/") && to !== "/products")
}

function Group({ item, openKey, setOpenKey }: { item: NavItem; openKey: string | null; setOpenKey: (k: string | null) => void }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const can = useCan()
  const settings = useAppSettings()
  const { state, setOpen, setOpenMobile } = useSidebar()
  const children = item.children?.filter((c) => (!c.perm || can(c.perm)) && (!c.when || c.when(settings)))
  const active = !!children?.some((c) => isUnder(pathname, c.to) || (c.to === "/products" && pathname.startsWith("/products/edit")))
  // Only one group is open at a time: opening another one closes this one (the sidebar holds the open key).
  const open = openKey === item.key
  useEffect(() => { if (active) setOpenKey(item.key) }, [active, item.key, setOpenKey])
  const label = t(`nav.${item.key}`)
  const Icon = item.icon

  if (!item.children) {
    if (item.perm && !can(item.perm)) return null
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={label} isActive={item.to === "/" ? pathname === "/" : isUnder(pathname, item.to!)}>
          <Link to={item.to!} onClick={() => setOpenMobile(false)}><Icon strokeWidth={1.6} /><span>{label}</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }
  if (!children?.length) return null

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label} isActive={active} aria-expanded={open}
        onClick={() => {
          // A collapsed (icon-only) sidebar has no room for the sub-menu: expand it first.
          if (state === "collapsed") { setOpen(true); setOpenKey(item.key) } else setOpenKey(open ? null : item.key)
        }}
      >
        <Icon strokeWidth={1.6} /><span>{label}</span>
        <ChevronDown className={cn("ms-auto size-3.5! transition-transform group-data-[collapsible=icon]:hidden", open && "rotate-180")} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {children.map((c) => {
            const current = pathname === c.to || (c.to === "/products" && pathname.startsWith("/products/edit"))
            return (
              <SidebarMenuSubItem key={c.to}>
                <SidebarMenuSubButton asChild isActive={current}>
                  <Link to={c.to} onClick={() => setOpenMobile(false)}><span>{t(`nav.${c.key}`)}</span></Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

/** The side menu on the shadcn Sidebar: logo on top, rounded rows, a sub-menu with a guide line; icon-only when collapsed, a sheet on phones. */
export function AppSidebar() {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const [openKey, setOpenKey] = useState<string | null>(null)
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center px-5 pt-5 pb-3.5 group-data-[collapsible=icon]:hidden">
        <Link to="/" onClick={() => setOpenMobile(false)}><Logo className="h-10" /></Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3 pt-0 pb-4 group-data-[collapsible=icon]:px-2">
          <SidebarGroupContent>
            <nav aria-label={t("nav.label")}>
              <SidebarMenu>
                {NAV.map((i) => <Group key={i.key} item={i} openKey={openKey} setOpenKey={setOpenKey} />)}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
