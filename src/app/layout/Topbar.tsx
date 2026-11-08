import { Link } from "react-router-dom"
import { Bell, Check, Globe, KeyRound, LogOut, LayoutGrid, Monitor, Moon, Package, ShoppingCart, Sun } from "lucide-react"
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme, type ThemeChoice } from "@/shared/theme/ThemeProvider"

const THEMES: { id: ThemeChoice; icon: typeof Sun }[] = [
  { id: "light", icon: Sun }, { id: "dark", icon: Moon }, { id: "system", icon: Monitor },
]

/** The old colours of the three quick buttons: blue, green, amber (each a soft background with matching text and icon). */
const quickA4 = "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
const quickPos = "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
const quickItem = "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"

/** The bar: the branch picker, three quick-action buttons and a row of round icon buttons. */
export function Topbar() {
  const { t, i18n } = useTranslation()
  const { choice, resolved, setChoice } = useTheme()
  const { user } = useSession()
  const postype = useAppSettings().salesScreenTab?.postype
  const posPath = postype === "Pos3" ? "/pos-optics" : postype === "Pos2" ? "/pos2" : "/pos"
  const logout = useLogout()
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3 md:px-6 print:hidden">
      <SidebarTrigger />
      <BranchSwitcher />
      <div className="order-last flex w-full gap-2 lg:order-none lg:w-auto">
        <Button asChild variant="secondary" className={cn("rounded-full max-lg:flex-1", quickA4)}><Link to="/sales/invoices/create"><LayoutGrid />{t("topbar.quickA4")}</Link></Button>
        <Button asChild variant="secondary" className={cn("rounded-full max-lg:flex-1", quickPos)}><Link to={posPath}><ShoppingCart />{t("topbar.quickPos")}</Link></Button>
        <Can perm={P.products.add}><Button asChild variant="ghost" className={cn("rounded-full bg-muted max-lg:flex-1", quickItem)}><Link to="/products/create"><Package />{t("topbar.quickItem")}</Link></Button></Can>
      </div>

      <div className="ms-auto flex items-center gap-1">
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
