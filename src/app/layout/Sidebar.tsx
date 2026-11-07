import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"
import { useCan } from "@/shared/permissions/usePermission"
import { useAppSettings } from "@/modules/settings"
import { NAV, type NavItem } from "./nav"

function isUnder(pathname: string, to: string) {
  return pathname === to || (pathname.startsWith(to + "/") && to !== "/products")
}

/** A top-level entry: a rounded row, the active one tinted. Hover is the light green of the Classic theme, grey in Modern. */
function Row({ icon: Icon, label, active, hasSubmenu, open, to, onClick }: {
  icon: LucideIcon; label: string; active?: boolean; hasSubmenu?: boolean; open?: boolean; to?: string; onClick?: () => void
}) {
  const classes = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sidebar-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
    active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
  )
  const content = (
    <>
      <Icon className="size-[18px] shrink-0" strokeWidth={1.6} />{label}
      {hasSubmenu && <ChevronDown className={cn("ms-auto size-3.5 transition-transform", open && "rotate-180")} />}
    </>
  )
  return to
    ? <Link to={to} onClick={onClick} className={classes}>{content}</Link>
    : <button type="button" aria-expanded={hasSubmenu ? open : undefined} onClick={onClick} className={classes}>{content}</button>
}

function Group({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
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
    return <Row icon={item.icon} label={label} to={item.to!} active={item.to === "/" ? pathname === "/" : isUnder(pathname, item.to!)} onClick={onNavigate} />
  }
  if (!children?.length) return null

  return (
    <>
      <Row icon={item.icon} label={label} hasSubmenu open={open} active={active} onClick={() => setOpen(!open)} />
      {open && (
        <div className="relative my-0.5 flex flex-col gap-px ps-[22px] before:absolute before:inset-y-1 before:start-[21px] before:w-px before:bg-sidebar-border">
          {children.map((c) => {
            const current = pathname === c.to || (c.to === "/products" && pathname.startsWith("/products/edit"))
            return (
              <Link key={c.to} to={c.to} onClick={onNavigate}
                className={cn("rounded-md py-1.5 ps-5 pe-3 text-[13px] text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                  current && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground")}>
                {t(`nav.${c.key}`)}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

/** The side menu: a 248px column with the logo on top, rounded rows and a sub-menu with a guide line; a drawer on phones. */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <aside className={cn(
        "z-[60] flex h-svh w-72 flex-col border-e bg-sidebar md:sticky md:top-0 md:z-30 md:w-[248px] md:shrink-0 print:hidden",
        "max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:transition-transform",
        open ? "max-md:translate-x-0" : "max-md:translate-x-full max-md:ltr:-translate-x-full",
      )}>
        <div className="flex justify-center px-5 pt-5 pb-3.5">
          <Link to="/" onClick={onClose}><Logo className="h-10" /></Link>
        </div>
        <nav aria-label={t("nav.label")} className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pb-4">
          {NAV.map((i) => <Group key={i.key} item={i} onNavigate={onClose} />)}
        </nav>
      </aside>
      {open && <button type="button" aria-label={t("nav.close")} className="fixed inset-0 z-[55] bg-black/30 md:hidden" onClick={onClose} />}
    </>
  )
}
