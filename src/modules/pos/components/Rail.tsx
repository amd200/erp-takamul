import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChefHat, ClipboardList, Home, ShoppingCart, Tv, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/modules/settings"
import { CustomerScreenDialog } from "./CustomerScreenDialog"
import { OrdersDialog } from "./OrdersDialog"

/** The slim column on the navy frame, as in the current POS: home, sales (this screen) and orders, then the customer and preparation screens when the branch uses them. */
export function Rail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const settings = useAppSettings()
  const beauty = settings.salonsTab?.beautyTheme === true
  const [orders, setOrders] = useState(false)
  const [customerScreen, setCustomerScreen] = useState(false)
  const inactive = beauty ? "text-[var(--text-muted)] hover:text-primary" : "text-white"

  const item = (key: string, label: string, Icon: LucideIcon, onClick: () => void, active = false, nowrap = false) => (
    <button key={key} type="button" onClick={onClick} title={label} style={{ width: 52 }}
      className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-200 ease-in-out",
        active ? "border-primary/20 bg-primary/10" : "border-transparent bg-transparent hover:bg-primary/5")}>
      <Icon size={21} strokeWidth={active ? 2.5 : 1.8} className={cn("transition-colors duration-200", active ? "text-primary" : inactive)} />
      <span className={cn("transition-colors duration-200", nowrap && "whitespace-nowrap", active ? "font-bold text-primary" : inactive)} style={{ fontSize: 9 }}>{label}</span>
    </button>
  )

  return (
    <>
      <nav aria-label={t("pos.nav")} className="flex w-16 shrink-0 flex-col items-center gap-0.5 bg-brand-navy py-3 max-lg:hidden">
        <div className="flex-1" />
        {item("home", t("pos.home"), Home, () => navigate("/"))}
        {item("sales", t("pos.sales"), ShoppingCart, () => undefined, true)}
        {item("orders", t("pos.orders"), ClipboardList, () => setOrders(true))}
        {settings.sales?.showCustomaresSalsesOrder && item("customer", t("pos1.customerScreen"), Tv, () => setCustomerScreen(true))}
        {settings.preparationScreenTab?.enablePreparationScreen && item("prep", t("pos1.preparation"), ChefHat, () => window.open("/pos/preparation", "_blank"), false, true)}
        <div className="flex-1" />
      </nav>
      <OrdersDialog open={orders} onOpenChange={setOrders} />
      <CustomerScreenDialog open={customerScreen} onOpenChange={setCustomerScreen} />
    </>
  )
}
