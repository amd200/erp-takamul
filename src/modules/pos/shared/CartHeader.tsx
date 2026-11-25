import { useEffect, useState } from "react"
import { Check, Globe, Moon, Pause, PauseCircle, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LANGUAGES } from "@/shared/i18n"
import { useTheme } from "@/shared/theme/ThemeProvider"
import { useEmployees } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { useFreeTables, useTables } from "@/modules/tables/queries"
import { useDeliveryCompanies, useHeldOrders } from "../queries"
import { usePosStore } from "../store"
import type { OrderType } from "../types"
import { NumberPromptDialog } from "./NumberPromptDialog"
import { OrdersDialog } from "./OrdersDialog"

/** The order types the branch sells from this screen, in the current POS's order. */
export function useOrderTypes() {
  const s = useAppSettings().salesScreenTab
  const types: OrderType[] = [...(s?.isTekawuy ? ["TakeAway" as const] : []), ...(s?.isTables ? ["InDine" as const] : []), ...(s?.isDelivary ? ["Delivery" as const] : [])]
  return { types, show: s?.showOrdertype !== false, none: s?.showOrdertype === false && !s?.isTekawuy && !s?.isTables && !s?.isDelivary }
}

/**
 * The strip above the cart, as in the current POS: connection speed, held invoices (when the customer ordering screen is
 * on), language and theme on one side; pager, close shift, order type, delivery company and service employee on the other.
 */
export function CartHeader({ onShift }: { onShift: () => void }) {
  const { t, i18n } = useTranslation()
  const { resolved, setChoice } = useTheme()
  const settings = useAppSettings()
  const orderType = usePosStore((s) => s.orderType)
  const companyId = usePosStore((s) => s.deliveryCompanyId)
  const employeeId = usePosStore((s) => s.employeeId)
  const pager = usePosStore((s) => s.orderDeviceNumber)
  const tableId = usePosStore((s) => s.tableId)
  const dineInMode = usePosStore((s) => s.dineInMode)
  const { setOrderType, setDeliveryCompany, setEmployee, setOrderDeviceNumber, setTable } = usePosStore.getState()
  const { types, show } = useOrderTypes()
  const delivery = orderType === "Delivery"
  const dineIn = orderType === "InDine"
  // A table already open (adding to it, or paying it) is not in the free list: its name comes from the full list.
  const open = dineInMode === "add-items" || dineInMode === "checkout"
  const freeTables = useFreeTables(dineIn && !open)
  const allTables = useTables(dineIn && open)
  const { data: companies = [] } = useDeliveryCompanies(delivery)
  const showEmployee = settings.salonsTab?.showEmployeeService === true
  const employees = useEmployees()
  const showHeld = settings.sales?.showCustomaresSalsesOrder === true
  const held = useHeldOrders(showHeld)
  const [pagerOpen, setPagerOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const heldCount = (held.data ?? []).length

  // The order type always stays one the branch has switched on.
  useEffect(() => {
    if (types.length && !dineInMode && !types.includes(orderType)) setOrderType(types[0])
  }, [types, orderType, dineInMode, setOrderType])

  // A default service employee that was deleted would send a missing id with the order.
  useEffect(() => {
    if (employees.isSuccess && employeeId && !(employees.data ?? []).some((e) => e.id === employeeId)) setEmployee(null)
  }, [employees.isSuccess, employees.data, employeeId, setEmployee])

  return (
    <div className="flex min-w-0 shrink-0 flex-nowrap items-center justify-between gap-1 overflow-x-auto border-b border-border px-2 py-3">
      <div className="flex shrink-0 items-center gap-1">
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-success">
          <span className="text-xs font-bold">{t("pos1.speedFast")}</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
        </div>

        {showHeld && (
          <button type="button" onClick={() => setHeldOpen(true)} title={t("pos1.suspendedInvoices")} className="relative rounded-full p-1.5 text-foreground transition-all duration-200 hover:bg-muted">
            <PauseCircle className="size-4.5" />
            {heldCount > 0 && <span aria-live="polite" className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">{heldCount}</span>}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={t("topbar.language")}><Globe className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {LANGUAGES.map((l) => <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)} className="flex items-center justify-between"><span>{l.label}</span>{i18n.language === l.code && <Check size={14} className="text-primary" />}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>

        {settings.salonsTab?.beautyTheme !== true && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 text-xs">{resolved === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}</Button></DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuItem onClick={() => setChoice("light")}><Sun className="size-3.5" />{t("pos1.lightMode")}{resolved === "light" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChoice("dark")}><Moon className="size-3.5" />{t("pos1.darkMode")}{resolved === "dark" && <Check className="ms-auto size-3.5" />}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {settings.preparationTicketTab?.showOrderDeviceNumber && (
          <Button type="button" size="sm" variant="outline" onClick={() => setPagerOpen(true)} className="h-7 shrink-0 rounded-full border-primary px-2 text-[11px] text-primary transition-all duration-200 hover:bg-primary hover:text-white">
            {t("pos.deviceNumberShort")}
          </Button>
        )}
        <Button type="button" size="sm" onClick={onShift} className="h-7 shrink-0 rounded-full text-[11px] transition-all duration-200"><Pause className="size-3" />{t("pos1.closeShift")}</Button>

        {show && (
          <div className="w-20 shrink-0">
            <Select value={orderType} disabled={open} onValueChange={(v) => { setOrderType(v as OrderType); setDeliveryCompany(null); setTable(null) }}>
              <SelectTrigger className="h-8 w-full shrink-0 px-1.5 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((o) => <SelectItem key={o} value={o}>{t(`pos.orderTypes.${o}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {dineIn && (
          <div className="w-24 shrink-0">
            <Select value={tableId ? String(tableId) : ""} disabled={open} onValueChange={(v) => setTable(Number(v))}>
              <SelectTrigger className="h-8 w-full px-2 text-[11px]"><SelectValue placeholder={t("posTables.chooseTable")} /></SelectTrigger>
              <SelectContent>{(open ? allTables.data : freeTables.data)?.filter((x) => !open || x.id === tableId).map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.tableName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {delivery && (
          <div className="w-24 shrink-0">
            <Select value={companyId ? String(companyId) : ""} onValueChange={(v) => setDeliveryCompany(Number(v))}>
              <SelectTrigger className="h-8 w-full px-2 text-[11px]"><SelectValue placeholder={t("pos.deliveryCompany")} /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {showEmployee && (
          <div className="w-28 shrink-0">
            <Select value={employeeId ? String(employeeId) : ""} onValueChange={(v) => setEmployee(v === "none" || !v ? null : Number(v))}>
              <SelectTrigger className="h-8 w-full px-2 text-[11px]"><SelectValue placeholder={t("pos.serviceEmployee")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("pos1.choose")}</SelectItem>
                {(employees.data ?? []).map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.firstName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <NumberPromptDialog open={pagerOpen} onOpenChange={setPagerOpen} title={t("pos.deviceNumberShort")} initial={pager} onConfirm={setOrderDeviceNumber} />
      <OrdersDialog open={heldOpen} onOpenChange={setHeldOpen} onlySuspended />
    </div>
  )
}
