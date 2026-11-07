import { Link } from "react-router-dom"
import { Bell, Check, Globe, KeyRound, LogOut, LayoutGrid, Menu, Monitor, Moon, Package, Search, ShoppingCart, Sun } from "lucide-react"
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

/** Classic keeps the old colours of the three quick buttons: blue, green, amber (each a soft background with matching text and icon). */
const quickA4 = "classic:bg-blue-50 classic:text-blue-700 classic:hover:bg-blue-100 classic:hover:text-blue-700 classic:dark:bg-blue-900/30 classic:dark:text-blue-300 classic:dark:hover:bg-blue-900/50"
const quickPos = "classic:bg-emerald-50 classic:text-emerald-700 classic:hover:bg-emerald-100 classic:hover:text-emerald-700 classic:dark:bg-emerald-900/30 classic:dark:text-emerald-300 classic:dark:hover:bg-emerald-900/50"
const quickItem = "classic:bg-amber-50 classic:text-amber-700 classic:hover:bg-amber-100 classic:hover:text-amber-700 classic:dark:bg-amber-900/30 classic:dark:text-amber-300 classic:dark:hover:bg-amber-900/50"

/** The bar: a search field, three quick-action buttons and a row of round icon buttons. */
function ModernTopbar({ onMenu }: { onMenu: () => void }) {
  const { t, i18n } = useTranslation()
  const { choice, resolved, setChoice } = useTheme()
  const { user } = useSession()
  const postype = useAppSettings().salesScreenTab?.postype
  const posPath = postype === "Pos3" ? "/pos-optics" : postype === "Pos2" ? "/pos2" : "/pos"
  const logout = useLogout()
  const classic = useClassic()
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6 print:hidden">
      <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label={t("nav.open")} onClick={onMenu}><Menu /></Button>
      {/* Classic: the branch picker takes the place of the search box. */}
      {classic ? <BranchSwitcher /> : (
        <div className="relative max-w-xs min-w-40 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <Input aria-label={t("common.search")} placeholder={t("topbar.search")} className="h-10 bg-card ps-9" />
        </div>
      )}
      <div className="order-last flex w-full gap-2 lg:order-none lg:w-auto">
        <Button asChild variant="secondary" className={cn("rounded-full max-lg:flex-1", quickA4)}><Link to="/sales/invoices/create">{classic && <LayoutGrid />}{t("topbar.quickA4")}</Link></Button>
        <Button asChild variant="secondary" className={cn("rounded-full max-lg:flex-1", quickPos)}><Link to={posPath}>{classic && <ShoppingCart />}{t("topbar.quickPos")}</Link></Button>
        <Can perm={P.products.add}><Button asChild variant="ghost" className={cn("rounded-full bg-muted max-lg:flex-1", quickItem)}><Link to="/products/create">{classic && <Package />}{t("topbar.quickItem")}</Link></Button></Can>
      </div>

      <div className="ms-auto flex items-center gap-1">
        {!classic && <BranchSwitcher />}
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

/** One bar for both looks; Classic only changes the colours (through the theme tokens). */
export function Topbar({ onMenu }: { drawerOpen?: boolean; onMenu: () => void }) {
  return <ModernTopbar onMenu={onMenu} />
}
