import { ClipboardList, Home, Maximize, Plus, Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { nextOrderNumber, useTailoringStore } from "../store"

/** The bar across the top: the screen's name and today's date, the next order number, then the orders board, new order, full screen and home. */
export function TailorTopBar({ onOrders, onNew }: { onOrders: () => void; onNew: () => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const orders = useTailoringStore((s) => s.orders)
  const ready = orders.filter((o) => o.status === "ready").length
  const today = new Intl.DateTimeFormat(i18n.language === "bn" ? "en" : i18n.language, { weekday: "long", day: "numeric", month: "long", numberingSystem: "latn" }).format(new Date())

  const toggleFull = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => undefined)
    else void document.exitFullscreen().catch(() => undefined)
  }

  return (
    <header className="flex shrink-0 items-center gap-2 border-b bg-card px-3 py-2.5 sm:gap-3 sm:px-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Scissors className="size-5" /></div>
      <div className="min-w-0">
        <h1 className="truncate text-base font-bold leading-tight">{t("tailoring.title")}</h1>
        <p className="truncate text-xs text-muted-foreground">{today}</p>
      </div>
      <div className="ms-2 hidden items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm text-primary md:flex">
        <span className="text-xs opacity-80">{t("tailoring.orderNo")}</span>
        <span dir="ltr" className="font-bold tabular-nums">{nextOrderNumber(orders)}</span>
      </div>

      <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
        <Button type="button" variant="outline" onClick={onOrders} className="relative border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <ClipboardList /><span className="hidden sm:inline">{t("tailoring.orders")}</span>
          {ready > 0 && <span className="absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full bg-success text-[11px] font-bold text-white">{ready}</span>}
        </Button>
        <Button type="button" onClick={onNew}><Plus /><span className="hidden sm:inline">{t("tailoring.newOrder")}</span></Button>
        <Button type="button" variant="outline" size="icon" title={t("pos.fullscreen")} aria-label={t("pos.fullscreen")} onClick={toggleFull} className="hidden size-10 sm:inline-flex"><Maximize /></Button>
        <Button type="button" variant="outline" size="icon" title={t("tailoring.home")} aria-label={t("tailoring.home")} onClick={() => navigate("/")} className="size-10"><Home /></Button>
      </div>
    </header>
  )
}
