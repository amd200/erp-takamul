import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronLeft, Folder, List, Plus, PlusCircle, RefreshCcw, FileText, Shield, Wrench, X, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { useAppSettings } from "@/modules/settings"
import { NAV, type NavItem } from "./nav"

/** The icon beside each sub-menu entry, as in the current system; entries not listed get the list icon. */
const CHILD_ICON: Record<string, LucideIcon> = {
  addItem: PlusCircle, categories: Folder, units: Wrench, additions: Folder,
  invoicesA4: FileText, invoicesPos: RefreshCcw, returns: FileText, debitNotes: FileText,
  addQuote: PlusCircle, addPurchase: Plus, addPurchaseScreen: Plus, roles: Shield,
}

function isUnder(pathname: string, to: string) {
  return pathname === to || (pathname.startsWith(to + "/") && to !== "/products")
}

/** A top-level entry: a rounded row, the active one filled with the brand colour. */
function Row({ icon: Icon, label, active, hasSubmenu, open, collapsed, to, onClick }: {
  icon: LucideIcon; label: string; active?: boolean; hasSubmenu?: boolean; open?: boolean; collapsed: boolean; to?: string; onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <Icon size={24} />
        {!collapsed && <span className="text-base font-bold tracking-wide">{label}</span>}
      </div>
      {hasSubmenu && !collapsed && <ChevronLeft size={16} className={cn("transition-transform", open && "-rotate-90")} />}
    </>
  )
  const classes = cn(
    "flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-start transition-all duration-200",
    active ? "scale-[1.02] bg-primary text-primary-foreground shadow-md" : "text-[var(--text-main)] hover:scale-[1.02] hover:bg-[var(--bg-main)] hover:text-primary",
    collapsed && "justify-center",
  )
  return to
    ? <Link to={to} onClick={onClick} title={collapsed ? label : undefined} className={classes}>{content}</Link>
    : <button type="button" aria-expanded={hasSubmenu ? open : undefined} onClick={onClick} title={collapsed ? label : undefined} className={classes}>{content}</button>
}

function Group({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const can = useCan()
  const settings = useAppSettings()
  const children = item.children?.filter((c) => (!c.perm || can(c.perm)) && (!c.when || c.when(settings)))
  const active = !!children?.some((c) => isUnder(pathname, c.to) || (c.to === "/products" && pathname.startsWith("/products/edit")))
  const [open, setOpen] = useState(active)
  useEffect(() => { if (active) setOpen(true) }, [active])
  const label = t(`nav.${item.key}`)

  if (!item.children) {
    if (item.perm && !can(item.perm)) return null
    return <Row icon={item.icon} label={label} collapsed={collapsed} to={item.to!} active={item.to === "/" ? pathname === "/" : isUnder(pathname, item.to!)} onClick={onNavigate} />
  }
  if (!children?.length) return null

  return (
    <>
      <Row icon={item.icon} label={label} collapsed={collapsed} hasSubmenu open={open} onClick={() => setOpen(!open)} />
      {open && !collapsed && (
        <div className="ms-4 space-y-1 overflow-hidden border-s border-gray-100 ps-2 dark:border-border">
          {children.map((c) => {
            const Icon = CHILD_ICON[c.key] ?? List
            const current = pathname === c.to || (c.to === "/products" && pathname.startsWith("/products/edit"))
            return (
              <Link key={c.to} to={c.to} onClick={onNavigate}
                className={cn("group flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors",
                  current ? "bg-primary text-primary-foreground" : "text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:text-primary")}>
                <Icon size={16} className={cn(current ? "text-primary-foreground" : "text-[var(--text-main)] group-hover:text-primary")} />
                <span>{t(`nav.${c.key}`)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

/** The side menu, laid out as in the current system: wide rows with big icons; 80px icon-only when collapsed; a drawer on phones. */
export function Sidebar({ open, collapsed, onClose }: { open: boolean; collapsed: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      {open && <button type="button" aria-label={t("nav.close")} className="fixed inset-0 z-[55] bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed inset-y-0 start-0 z-[60] h-dvh w-[280px] overflow-y-auto overscroll-contain border-e bg-card transition-all duration-300",
        "lg:sticky lg:top-0 lg:z-50 lg:shrink-0 print:hidden",
        collapsed ? "lg:w-20" : "lg:w-[270px]",
        open ? "translate-x-0" : "translate-x-full ltr:-translate-x-full lg:translate-x-0 lg:ltr:translate-x-0",
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex flex-1 items-center justify-center overflow-hidden"><Logo className={collapsed ? "h-14" : "h-15"} /></div>
          <button type="button" onClick={onClose} aria-label={t("nav.close")} className="p-1 text-[var(--text-muted)] transition-colors hover:text-red-500 lg:hidden"><X size={20} /></button>
        </div>
        <nav aria-label={t("nav.label")} className="space-y-1 p-3">
          {NAV.map((i) => <Group key={i.key} item={i} collapsed={collapsed} onNavigate={onClose} />)}
        </nav>
      </aside>
    </>
  )
}
