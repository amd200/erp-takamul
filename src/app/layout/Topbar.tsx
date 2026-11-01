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
import { BranchSwitcher } from "./BranchSwitcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useClassic, useTheme, type ThemeChoice, type UiStyle } from "@/shared/theme/ThemeProvider"

const THEMES: { id: ThemeChoice; icon: typeof Sun }[] = [
  { id: "light", icon: Sun }, { id: "dark", icon: Moon }, { id: "system", icon: Monitor },
]

const STYLES: UiStyle[] = ["modern", "classic"]

/** The look entries of the theme menu, shared by both bars (the mode light / dark / system comes first). */
function StyleItems({ itemClass }: { itemClass?: string }) {
  const { t } = useTranslation()
  const { style, setStyle } = useTheme()
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">{t("topbar.style")}</DropdownMenuLabel>
      {STYLES.map((id) => (
        <DropdownMenuItem key={id} onSelect={() => setStyle(id)} className={cn(itemClass, "justify-between")}>
          <span>{t(`topbar.styles.${id}`)}</span>{style === id && <Check size={16} className="text-primary" />}
        </DropdownMenuItem>
      ))}
    </>
  )
}

/** The erpv2 bar: a search field, three quick-action buttons and a row of round icon buttons. */
function ModernTopbar({ onMenu }: { onMenu: () => void }) {
  const { t, i18n } = useTranslation()
  const { choice, resolved, setChoice } = useTheme()
  const { user } = useSession()
  const postype = useAppSettings().salesScreenTab?.postype
  const posPath = postype === "Pos3" ? "/pos-optics" : postype === "Pos2" ? "/pos2" : "/pos"
  const logout = useLogout()
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6 print:hidden">
      <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label={t("nav.open")} onClick={onMenu}><Menu /></Button>
      <div className="relative max-w-xs min-w-40 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <Input aria-label={t("common.search")} placeholder={t("topbar.search")} className="h-10 bg-card ps-9" />
      </div>
      <div className="hidden gap-2 lg:flex">
        <Button asChild variant="secondary" className="rounded-full"><Link to="/sales/invoices/create">{t("topbar.quickA4")}</Link></Button>
        <Button asChild variant="secondary" className="rounded-full"><Link to={posPath}>{t("topbar.quickPos")}</Link></Button>
        <Can perm={P.products.add}><Button asChild variant="ghost" className="rounded-full bg-muted"><Link to="/products/create">{t("topbar.quickItem")}</Link></Button></Can>
      </div>

      <div className="ms-auto flex items-center gap-1">
        <BranchSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="relative rounded-full" aria-label={t("topbar.notifications")}>
              <Bell /><span className="absolute end-2 top-2 size-2 rounded-full border-2 border-background bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t("topbar.notifications")}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/reports/low-stock" className="flex flex-col items-start gap-0.5">
                <span className="font-medium">{t("topbar.lowStockTitle")}</span>
                <span className="text-xs text-muted-foreground">{t("topbar.lowStockBody")}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={t("topbar.theme")}>{resolved === "dark" ? <Moon /> : <Sun />}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {THEMES.map(({ id, icon: Icon }) => (
              <DropdownMenuItem key={id} onSelect={() => setChoice(id)}>
                <Icon />{t(`topbar.themes.${id}`)}{choice === id && <Check className="ms-auto" />}
              </DropdownMenuItem>
            ))}
            <StyleItems />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={t("topbar.language")}><Globe /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem key={l.code} onSelect={() => i18n.changeLanguage(l.code)}>
                {l.label}{i18n.language === l.code && <Check className="ms-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 rounded-full px-1" aria-label={t("topbar.account")}>
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-[13px] font-semibold text-secondary-foreground">{(user.name[0] ?? "?").toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span dir="ltr" className="text-start">{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><KeyRound />{t("topbar.changePassword")}</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => logout.mutate()}><LogOut />{t("topbar.logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/** One round icon button of the strip: grey, turning green on hover. */
const iconButton = "relative flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-primary sm:size-10"
/** The three quick-action pills, each in its own pastel colour. */
const pill = "flex h-auto shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:shadow-sm active:scale-95"
/** The drop-down panels look like the current system's: a white card, thin border, soft shadow. */
const panel = "mt-2 rounded-lg border bg-card py-1 shadow-lg"
const panelItem = "px-4 py-2 text-sm text-[var(--text-main)]"

export function Topbar({ drawerOpen, onMenu, onToggleSidebar }: { drawerOpen: boolean; onMenu: () => void; onToggleSidebar: () => void }) {
  const classic = useClassic()
  return classic ? <ClassicTopbar drawerOpen={drawerOpen} onMenu={onMenu} onToggleSidebar={onToggleSidebar} /> : <ModernTopbar onMenu={onMenu} />
}

function ClassicTopbar({ drawerOpen, onMenu, onToggleSidebar }: { drawerOpen: boolean; onMenu: () => void; onToggleSidebar: () => void }) {
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
        <div className="me-auto min-w-0 lg:me-0"><BranchSwitcher /></div>
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
            <StyleItems itemClass={panelItem} />
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
