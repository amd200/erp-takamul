import { Link } from "react-router-dom"
import { Bell, Check, ChevronDown, Globe, KeyRound, LayoutGrid, LogOut, Menu, Monitor, Moon, Package, Search, ShoppingCart, Sun, User, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { LANGUAGES } from "@/shared/i18n"
import { useSession } from "@/shared/session/session"
import { useAppSettings } from "@/modules/settings"
import { useLogout } from "@/modules/auth/queries"
import { useTheme, type ThemeChoice } from "@/shared/theme/ThemeProvider"

const THEMES: { id: ThemeChoice; icon: typeof Sun }[] = [
  { id: "light", icon: Sun }, { id: "dark", icon: Moon }, { id: "system", icon: Monitor },
]

/** One round icon button of the strip: grey, turning green on hover. */
const iconButton = "relative flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-primary sm:size-10"
/** The three quick-action pills, each in its own pastel colour. */
const pill = "flex h-auto shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
/** The drop-down panels look like the current system's: a white card, thin border, soft shadow. */
const panel = "mt-2 rounded-lg border bg-card py-1 shadow-lg"
const panelItem = "px-4 py-2 text-sm text-[var(--text-main)]"

export function Topbar({ drawerOpen, onMenu, onToggleSidebar }: { drawerOpen: boolean; onMenu: () => void; onToggleSidebar: () => void }) {
  const { t, i18n } = useTranslation()
  const { choice, resolved, setChoice } = useTheme()
  const { user } = useSession()
  const postype = useAppSettings().salesScreenTab?.postype
  const posPath = postype === "Pos3" ? "/pos-optics" : postype === "Pos2" ? "/pos2" : "/pos"
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b bg-card px-2 shadow-sm transition-colors duration-300 sm:px-4 lg:px-8 print:hidden">
      <div className="flex shrink-0 items-center gap-2 lg:gap-4">
        <button type="button" onClick={onMenu} aria-label={drawerOpen ? t("nav.close") : t("nav.open")} className="flex size-10 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-main)] lg:hidden">
          {drawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button type="button" onClick={onToggleSidebar} aria-label={t("nav.toggle")} className="hidden rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-main)] lg:block"><Menu size={24} /></button>

        <div className="hidden w-60 items-center rounded-full border bg-[var(--input-bg)] px-3 py-1.5 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 md:flex">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input type="text" aria-label={t("common.search")} placeholder={t("topbar.search")} className="h-7 w-full border-none bg-transparent px-2 text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 sm:gap-2 lg:flex-none lg:gap-3">
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link to="/sales/invoices/create" className={cn(pill, "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50")}><LayoutGrid size={15} />{t("topbar.quickA4")}</Link>
          <Link to={posPath} className={cn(pill, "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50")}><ShoppingCart size={15} />{t("topbar.quickPos")}</Link>
          <Can perm={P.products.add}>
            <Link to="/products/create" className={cn(pill, "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50")}><Package size={15} />{t("topbar.quickItem")}</Link>
          </Can>
        </div>

        {/* On a phone the quick actions share one shopping-cart menu. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t("nav.sales")} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:scale-95 lg:hidden dark:bg-emerald-900/30 dark:text-emerald-300"><ShoppingCart size={16} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className={cn(panel, "w-48")}>
            <DropdownMenuItem asChild className={panelItem}><Link to={posPath}><ShoppingCart size={16} className="text-emerald-600" />{t("topbar.quickPos")}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild className={panelItem}><Link to="/sales/invoices/create"><LayoutGrid size={16} className="text-blue-600" />{t("topbar.quickA4")}</Link></DropdownMenuItem>
            <Can perm={P.products.add}><DropdownMenuItem asChild className={panelItem}><Link to="/products/create"><Package size={16} className="text-amber-600" />{t("topbar.quickItem")}</Link></DropdownMenuItem></Can>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={iconButton} aria-label={t("topbar.notifications")}>
              <Bell size={20} /><span className="absolute end-1 top-1 size-2 rounded-full bg-red-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(panel, "w-80 py-2")}>
            <DropdownMenuLabel className="border-b bg-zinc-50/50 px-4 py-2 text-sm font-bold text-[var(--text-main)] dark:bg-zinc-800/10">{t("topbar.notifications")}</DropdownMenuLabel>
            <DropdownMenuItem asChild className="px-4 py-3">
              <Link to="/reports/low-stock" className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-semibold text-[var(--text-main)]">{t("topbar.lowStockTitle")}</span>
                <span className="text-xs text-[var(--text-muted)]">{t("topbar.lowStockBody")}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={iconButton} aria-label={t("topbar.theme")}>{resolved === "dark" ? <Moon size={20} /> : <Sun size={20} />}</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(panel, "w-44")}>
            {THEMES.map(({ id, icon: Icon }) => (
              <DropdownMenuItem key={id} onSelect={() => setChoice(id)} className={cn(panelItem, "justify-between")}>
                <span className="flex items-center gap-2"><Icon size={16} />{t(`topbar.themes.${id}`)}</span>{choice === id && <Check size={16} className="text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={iconButton} aria-label={t("topbar.language")}><Globe size={20} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(panel, "w-40")}>
            {LANGUAGES.map((l) => (
              <DropdownMenuItem key={l.code} onSelect={() => i18n.changeLanguage(l.code)} className={cn(panelItem, "justify-between")}>
                <span>{l.label}</span>{i18n.language === l.code && <Check size={16} className="text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t("topbar.account")} className="flex h-9 items-center gap-2 rounded-lg px-0.5 hover:bg-[var(--bg-main)] sm:h-10 sm:px-1">
              <span className="flex size-8 items-center justify-center rounded-full border bg-[var(--bg-main)]"><User size={18} className="text-[var(--text-muted)]" /></span>
              <span className="hidden text-sm font-medium text-[var(--text-main)] md:block">{user.name}</span>
              <ChevronDown size={16} className="hidden text-[var(--text-muted)] sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(panel, "w-48")}>
            <DropdownMenuItem className={panelItem}><KeyRound size={16} />{t("topbar.changePassword")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => logout.mutate()} className="px-4 py-2 text-sm"><LogOut size={16} />{t("topbar.logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
