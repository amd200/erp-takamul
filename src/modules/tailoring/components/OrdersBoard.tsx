import { useState } from "react"
import { ArrowLeftRight, CalendarCheck, ClipboardList, Phone, Search, User, X, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CurrencySymbol } from "@/modules/settings"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useTailoringStore } from "../store"
import { ORDER_STATUSES, type OrderStatus } from "../types"

const BADGE: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  cutting: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  sewing: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  ready: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  delivered: "bg-muted text-muted-foreground",
}

/**
 * The shop's orders by work status, in the sales screen's orders window style. Each order moves to its next status
 * (new, cutting, sewing, ready, delivered); a late one (past its delivery date and not delivered) is marked.
 */
export function OrdersBoard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const orders = useTailoringStore((s) => s.orders)
  const advance = useTailoringStore((s) => s.advance)
  const [tab, setTab] = useState<OrderStatus | "all">("all")
  const [search, setSearch] = useState("")
  const today = new Date().toISOString().slice(0, 10)

  const q = search.trim()
  const shown = orders.filter((o) => (tab === "all" || o.status === tab) && (!q || o.number.includes(q) || o.customer.includes(q) || o.phone.includes(q)))
  const countOf = (s: OrderStatus | "all") => (s === "all" ? orders.length : orders.filter((o) => o.status === s).length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 text-foreground" style={{ maxWidth: 720, width: "95vw", maxHeight: "88vh" }}>
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-foreground/10 bg-sidebar px-4 py-3">
          <DialogTitle className="text-[14px] font-semibold text-sidebar-foreground">{t("tailoring.board.title")}</DialogTitle>
          <button type="button" aria-label={t("common.close")} onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-lg bg-sidebar-foreground/10 text-sidebar-foreground transition-colors hover:bg-sidebar-foreground/20"><X size={14} /></button>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-card px-4 py-3">
          {(["all", ...ORDER_STATUSES] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${tab === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
              {t(`tailoring.status.${k}`)} ({countOf(k)})
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-2.5">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("tailoring.board.search")}
            className="h-8 w-full flex-1 rounded-lg border border-border bg-background px-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Search size={13} /></span>
        </div>
        <div className="shrink-0 border-b border-border bg-card px-4 py-1.5">
          <span className="text-[11px] text-muted-foreground">{t("tailoring.board.count", { n: shown.length })}</span>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          {shown.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <ClipboardList size={32} className="opacity-30" />
              <p className="text-sm">{t("tailoring.board.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {shown.map((o) => {
                const late = o.status !== "delivered" && !!o.delivery && o.delivery < today
                const next = ORDER_STATUSES[ORDER_STATUSES.indexOf(o.status) + 1]
                const remaining = o.total - o.paid
                return (
                  <div key={o.number} className="flex w-full flex-col justify-between gap-3 border-b border-border/50 bg-card px-4 py-3.5 transition-colors hover:bg-muted sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full sm:mt-0 ${BADGE[o.status]}`}><ClipboardList size={14} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span dir="ltr" className="text-[12px] font-semibold text-primary">{o.number}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE[o.status]}`}>{t(`tailoring.status.${o.status}`)}</span>
                          {o.urgent && <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"><Zap size={10} />{t("tailoring.dates.urgent")}</span>}
                          {late && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{t("tailoring.board.late")}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><User size={10} />{o.customer || "—"}</span>
                          {o.phone && <span dir="ltr" className="flex items-center gap-1 tabular-nums"><Phone size={10} />{o.phone}</span>}
                          <span>{t("tailoring.board.pieces", { n: o.pieces })}</span>
                          <span className={cn("flex items-center gap-1", late && "font-bold text-destructive")}><CalendarCheck size={10} /><span dir="ltr" className="tabular-nums">{o.delivery || "—"}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="my-0.5 w-full border-t border-dashed border-border/60 sm:hidden" />
                    <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:justify-end">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="flex items-center gap-1 text-[12px] font-bold text-foreground">{formatMoney(o.total)}<CurrencySymbol size={11} /></span>
                        {remaining > 0 && <span className="text-[10px] font-semibold text-destructive">{t("tailoring.totals.remaining")} {formatMoney(remaining)}</span>}
                      </div>
                      {next && (
                        <button type="button" onClick={() => advance(o.number)} title={t("tailoring.board.next", { status: t(`tailoring.status.${next}`) })}
                          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                          <ArrowLeftRight size={13} />{t(`tailoring.status.${next}`)}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
