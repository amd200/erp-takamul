import { useNavigate } from "react-router-dom"
import { ClipboardList, FilePlus2, Home, Scissors, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { useTailoringStore } from "../store"

/** The slim column on the navy frame, like the sales screen's: home, this screen, the orders board and a new order. */
export function TailorRail({ onOrders, onNew }: { onOrders: () => void; onNew: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ready = useTailoringStore((s) => s.orders.filter((o) => o.status === "ready").length)

  const item = (key: string, label: string, Icon: LucideIcon, onClick: () => void, active = false, badge = 0) => (
    <button key={key} type="button" onClick={onClick} title={label} style={{ width: 52 }}
      className={cn("relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border py-2.5 text-white transition-all duration-200 ease-in-out",
        active ? "border-white/20 bg-white/15" : "border-transparent bg-transparent hover:bg-white/10")}>
      <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
      <span className={cn("text-center leading-tight", active && "font-bold")} style={{ fontSize: 9 }}>{label}</span>
      {badge > 0 && <span className="absolute -top-1 end-0.5 flex size-4.5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  )

  return (
    <nav aria-label={t("pos.nav")} className="flex w-16 shrink-0 flex-col items-center gap-0.5 bg-brand-navy py-3 max-lg:hidden">
      <div className="flex-1" />
      {item("home", t("pos.home"), Home, () => navigate("/"))}
      {item("tailoring", t("tailoring.short"), Scissors, () => undefined, true)}
      {item("orders", t("tailoring.orders"), ClipboardList, onOrders, false, ready)}
      {item("new", t("tailoring.newOrder"), FilePlus2, onNew)}
      <div className="flex-1" />
    </nav>
  )
}
