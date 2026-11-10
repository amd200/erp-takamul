import { useState } from "react"
import type { EmployeeDto } from "@/modules/lookups/types"
import { Link } from "react-router-dom"
import { CalendarDays, Check, Eye, FileText, Globe, Hash, Home, Maximize, Monitor, Moon, Pause, Plus, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { useAppSettings } from "@/modules/settings"
import { CashDrawerButton } from "../components/CashDrawerButton"
import { CustomerPicker } from "../components/CustomerPicker"

const toolButton = "size-6.75 rounded-[9px] border-[#dfe8f1] bg-white text-[#17375f] shadow-[0_3px_10px_rgba(18,60,99,0.07)] transition-colors duration-200 hover:bg-[#f3f8fc] dark:bg-background dark:text-foreground"
const greenButton = "h-6.75 min-w-0 rounded-full border border-[#0fa95a]/70 bg-gradient-to-b from-[#27c978] to-[#16ae61] px-1.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(22,174,97,0.30),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all duration-200 hover:from-[#20bd6e] hover:to-[#119c54] hover:text-white active:scale-[0.97] sm:px-2.25 sm:text-[12px] xl:px-3 xl:text-[13px]"
const label = "text-[13px] font-bold text-[#17375f] dark:text-foreground"
const field = "h-8.25 max-sm:h-10 rounded-[3px] border-[#dfe8f1] bg-white text-[9px] max-sm:text-xs md:text-[10.5px] text-[#17375f] shadow-[0_3px_10px_rgba(18,60,99,0.05)] dark:bg-background dark:text-foreground"

type Props = {
  invoiceNumber: string
  shiftId: number
  customerId: number | null
  customerName: string
  onCustomer: (id: number | null, name: string) => void
  onAddCustomer: () => void
  balance: string | null
  employees: EmployeeDto[] | null
  employeeId: number | null
  onEmployee: (id: number | null) => void
  note: string
  onNote: (n: string) => void
  onShift: () => void
  locked: boolean
  /** The optics screen: an eye button for the customer tools in place of "+", and no cash drawer button. */
  optics?: boolean
  onTools?: () => void
  /** Whose measurements go on the invoice, when picked (the eye button turns green). */
  measurement?: string | null
}

/**
 * The header of the second sales screen, laid out as in the current system: screen tools, the invoice
 * number, shift and date, the shift and home buttons, then the customer, balance, service employee and note.
 */
export function Pos2Header(p: Props) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const date = new Intl.DateTimeFormat(i18n.language === "bn" ? "en" : i18n.language, { weekday: "long", day: "numeric", month: "long", year: "numeric", numberingSystem: "latn" }).format(new Date())
  const [, rerender] = useState(0)

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
      rerender((n) => n + 1)
    } catch { /* the browser may refuse; the screen works the same either way */ }
  }

  return (
    <div className="w-full text-[14.5px]/[1.4286]">
      <div className="flex flex-col gap-2.25 sm:gap-3">
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute top-[calc(100%-9px)] left-0 h-full w-15 bg-[rgba(226,239,251,0.96)] dark:opacity-20" style={{ clipPath: "polygon(0 0, 100% 0, 0 64%)" }} />
          <div className="relative z-[1] flex min-h-[57px] flex-col gap-2.25 overflow-hidden rounded-b-[13.5px] border border-t-0 border-[#dfe8f1] bg-card px-2.25 py-2.25 shadow-[0_7px_21px_rgba(18,60,99,0.09)] sm:px-3.75 xl:grid xl:grid-cols-[minmax(202.5px,1fr)_auto_minmax(225px,1fr)] xl:items-center xl:px-5.25 xl:py-0 dark:border-border">
            <div aria-hidden className="pointer-events-none absolute -top-1.5 left-0 h-full w-15 bg-[rgba(205,241,227,0.96)] dark:opacity-20" style={{ clipPath: "polygon(0 0, 100% 0, 0 64%)" }} />

            <div className="z-[1] flex w-full flex-wrap items-center justify-between gap-1.5 xl:w-auto xl:justify-self-start xl:justify-start xl:gap-2.25">
              <div className="flex items-center gap-1.5">
                <Button type="button" onClick={toggleFull} variant="outline" size="icon" className={toolButton} title={t("pos.fullscreen")} aria-label={t("pos.fullscreen")}>
                  <Maximize size={12.75} strokeWidth={1.9} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className={toolButton} aria-label={t("topbar.language")}><Globe size={12.75} strokeWidth={1.9} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {LANGUAGES.map((l) => <DropdownMenuItem key={l.code} onSelect={() => i18n.changeLanguage(l.code)}>{l.label}{i18n.language === l.code && <Check className="ms-auto" />}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!beauty && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className={toolButton} aria-label={t("topbar.theme")}>
                        {resolved === "dark" ? <Moon className="size-[12.75px]" strokeWidth={1.9} /> : <Sun className="size-[12.75px]" strokeWidth={1.9} />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="start">
                      <DropdownMenuItem onSelect={() => setChoice("light")}><Sun className="size-3.5" />{t("pos1.lightMode")}{resolved === "light" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setChoice("dark")}><Moon className="size-3.5" />{t("pos1.darkMode")}{resolved === "dark" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="hidden h-5.25 w-px bg-[#dfe8f1] sm:block dark:bg-border" />

              <div className="flex flex-wrap items-center gap-1.125">
                <span className="inline-flex h-6.75 min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#dfe8f1] bg-white px-2.25 text-[12px] font-bold text-[#17375f] shadow-[0_3px_10px_rgba(18,60,99,0.07)] sm:min-w-[103.5px] sm:px-3.75 sm:text-[13px] dark:border-border dark:bg-background dark:text-foreground">
                  <Monitor size={11.25} strokeWidth={1.9} />
                  {t("pos2.salesScreen")}
                </span>
              </div>
            </div>

            <div className="z-[1] grid w-full shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-3 xl:flex xl:w-auto xl:justify-self-center xl:gap-0">
              <div className="flex min-w-0 items-center justify-center gap-1.5 px-1.5 sm:gap-2.25 sm:px-3 xl:min-w-[132px] xl:border-l xl:border-[#dfe8f1] xl:px-3.75 dark:xl:border-border">
                <Hash className="size-[13.5px] shrink-0 text-[#17375f] dark:text-foreground" strokeWidth={2.2} />
                <div className="flex min-w-0 flex-col items-center gap-0.75">
                  <span className="text-[12px] text-muted-foreground">{t("pos2.invoiceNumber")}</span>
                  <span className="text-[13px] font-extrabold text-[#17375f] dark:text-foreground" dir="ltr">{p.invoiceNumber}</span>
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-center gap-1.5 px-1.5 sm:gap-2.25 sm:px-3 xl:min-w-[112.5px] xl:border-l xl:border-[#dfe8f1] xl:px-3.75 dark:xl:border-border">
                <FileText className="size-[13.5px] shrink-0 text-[#17375f] dark:text-foreground" strokeWidth={1.9} />
                <div className="flex min-w-0 flex-col items-center gap-0.75">
                  <span className="text-[12px] text-muted-foreground">{t("pos2.shiftCode")}</span>
                  <span className="text-[13px] font-extrabold text-[#17375f] dark:text-foreground" dir="ltr">{p.shiftId}</span>
                </div>
              </div>
              <div className="col-span-2 flex min-w-0 items-center justify-center gap-1.5 px-1.5 sm:col-span-1 sm:gap-2.25 sm:px-3 xl:min-w-[165px] xl:px-3.75">
                <CalendarDays className="size-[13.5px] shrink-0 text-[#17375f] dark:text-foreground" strokeWidth={1.9} />
                <div className="flex min-w-0 flex-col items-center gap-0.75 max-sm:flex-row max-sm:gap-2">
                  <span className="text-[12px] text-muted-foreground">{t("pos2.invoiceDate")}</span>
                  <span className="max-w-full truncate text-[11px] font-extrabold text-[#17375f] sm:text-[12px] dark:text-foreground">{t("pos2.today")}، {date}</span>
                </div>
              </div>
            </div>

            <div className={cn("z-[1] grid w-full items-center gap-1.125 xl:flex xl:w-auto xl:justify-self-end xl:gap-0.75", p.optics ? "grid-cols-2" : "grid-cols-3")}>
              {!p.optics && <CashDrawerButton className={`${greenButton} xl:min-w-[81px] [&_svg]:size-[11.25px]`} />}
              <Button type="button" size="sm" onClick={p.onShift} className={`${greenButton} xl:min-w-[87px]`}>
                <Pause className="size-[11.25px]" strokeWidth={1.9} />
                {t("pos2.closeShift")}
              </Button>
              <Button asChild size="sm" className={`${greenButton} xl:min-w-[69px]`}>
                <Link to="/">
                  {t("pos2.home")}
                  <Home className="size-[11.25px]" strokeWidth={1.9} />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-2 items-end gap-2.25 px-2.25 pb-2.25 sm:grid-cols-2 sm:px-3.75 xl:gap-3.75 ${p.balance != null ? "xl:grid-cols-[1fr_5rem_1fr_1fr_1fr]" : "xl:grid-cols-4"} xl:px-4.5 xl:pb-3`}>
          <div className="col-span-2 flex items-end gap-1.5 sm:col-span-1">
{p.optics ? (
              <Button type="button" size="icon-lg" variant="outline" disabled={p.locked} onClick={p.onTools} aria-label={t("pos.optics.tools")}
                title={p.measurement ? `${t("pos.optics.selectedMeasurement")}: ${p.measurement}` : t("pos.optics.tools")}
                className={cn("size-8.25 max-sm:size-10 shrink-0 rounded-[9px] shadow-[0_5px_13px_rgba(8,43,102,0.12)] transition-colors", p.measurement ? "border-[#17a95c] bg-[#1db56c] text-white hover:bg-[#18a760] hover:text-white" : "")}>
                <Eye size={15} strokeWidth={2.2} />
              </Button>
            ) : (
            <Button type="button" size="icon-lg" variant="outline" disabled={p.locked} aria-label={t("customers.add")} onClick={p.onAddCustomer}
              className="size-8.25 max-sm:size-10 shrink-0 rounded-[9px]">
              <Plus size={15} strokeWidth={2.2} />
            </Button>
            )}
            <div className="flex flex-1 flex-col gap-0.75">
              <span className={label}>{t("pos2.chooseCustomer")}</span>
              <div className="[&_button]:h-8.25 max-sm:[&_button]:h-10 [&_button]:rounded-[3px] [&_button]:border-[#dfe8f1] [&_button]:bg-white [&_button]:text-[9px] max-sm:[&_button]:text-xs md:[&_button]:text-[10.5px] [&_svg]:size-3! [&_button]:text-[#17375f] [&_button]:shadow-[0_3px_10px_rgba(18,60,99,0.05)] dark:[&_button]:bg-background dark:[&_button]:text-foreground">
                <CustomerPicker tools={false} clearable={false} customerId={p.customerId} name={p.customerName} disabled={p.locked} onPick={p.onCustomer} />
              </div>
            </div>
          </div>

          {p.balance != null && (
            <div className={cn("flex shrink-0 flex-col gap-0.75 sm:w-full xl:w-20", p.employees ? "col-span-1" : "col-span-2", "sm:col-span-1")}>
              <span className={label}>{t("pos2.customerBalance")}</span>
              <div className={`${field} flex cursor-not-allowed items-center justify-center border font-extrabold tabular-nums`}>{p.balance}</div>
            </div>
          )}

          {p.employees && (
            <div className={cn("flex flex-col gap-0.75", p.balance != null ? "col-span-1" : "col-span-2", "sm:col-span-1")}>
              <span className={label}>{t("pos2.serviceEmployee")}</span>
              <Select value={p.employeeId ? String(p.employeeId) : "none"} disabled={p.locked} onValueChange={(v) => p.onEmployee(v === "none" ? null : Number(v))}>
                <SelectTrigger className={`${field} h-8.25! max-sm:h-10! w-full text-[8.25px] max-sm:text-xs focus:ring-0 [&_svg]:size-3!`} aria-label={t("pos2.serviceEmployee")}><SelectValue placeholder={t("pos2.choose")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("pos2.choose")}</SelectItem>
                  {p.employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.firstName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="col-span-2 flex flex-col gap-0.75 sm:col-span-1">
            <span className={label}>{t("pos2.notes")}</span>
            <Textarea value={p.note} disabled={p.locked} onChange={(e) => p.onNote(e.target.value)} rows={1} placeholder={t("pos2.notePlaceholder")} aria-label={t("pos2.notes")}
              className={`${field} min-h-8.25 max-sm:min-h-10 resize-none px-3 py-2.25`} />
          </div>
        </div>
      </div>
    </div>
  )
}
