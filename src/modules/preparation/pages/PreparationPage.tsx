import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { isReady } from "../types"
import { Check, ChefHat, Home, Maximize2, Minimize2, Printer, RefreshCw, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/EmptyState"
import { cn } from "@/lib/utils"
import { printDocument, renderDocument } from "@/shared/print"
import { useAppSettings } from "@/modules/settings"
import { bonDoc, ticketOptions, type BonStatus } from "../bon"
import { useMarkReady, usePreparationOrders } from "../queries"
import type { PrepOrder } from "../types"

/** Counts down to the time the kitchen has to prepare the order, then up in red once it is late. */
function Countdown({ since, minutes, onWarning, onExpired }: { since: string; minutes: number; onWarning: () => void; onExpired: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const warned = useRef(false)
  const expired = useRef(false)

  useEffect(() => {
    const tick = () => {
      const current = Date.now()
      setNow(current)
      const elapsed = Math.max(0, Math.floor((current - new Date(since).getTime()) / 1000))
      const limit = minutes * 60
      if (!warned.current && elapsed >= Math.max(0, limit - 30) && elapsed < limit) { warned.current = true; onWarning() }
      if (!expired.current && elapsed >= limit) { expired.current = true; onExpired() }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [since, minutes, onWarning, onExpired])

  const elapsed = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
  const late = elapsed >= minutes * 60
  const shown = late ? elapsed - minutes * 60 : minutes * 60 - elapsed
  return (
    <span dir="ltr" className={cn("inline-flex h-8 min-w-24 items-center justify-center rounded-lg border-2 px-3 text-sm font-bold tabular-nums", late ? "border-destructive bg-destructive-soft text-destructive" : "border-warning bg-warning-soft text-warning")}>
      {String(Math.floor(shown / 60)).padStart(2, "0")} : {String(shown % 60).padStart(2, "0")}
    </span>
  )
}

const BORDER: Record<BonStatus, string> = { pending: "border-warning", ready: "border-success", overdue: "border-destructive" }
const FOOTER: Record<BonStatus, string> = { pending: "bg-warning", ready: "bg-success", overdue: "bg-destructive" }

function Ticket({ order, minutes, onReady, onPrint, busy }: { order: PrepOrder; minutes: number; onReady: () => void; onPrint: () => void; busy: boolean }) {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const [warning, setWarning] = useState(false)
  const [overdue, setOverdue] = useState(false)
  const late = overdue && !isReady(order)
  const status: BonStatus = isReady(order) ? "ready" : late ? "overdue" : "pending"
  const html = useMemo(() => renderDocument(bonDoc(order, ticketOptions(settings, status, "preview"))), [order, settings, status])

  return (
    <div className={cn("flex h-96 w-full min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-card", BORDER[status], warning && !isReady(order) && !late && "animate-pulse")}>
      <div dir="ltr" className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
        <Button type="button" size="icon-sm" variant={isReady(order) ? "secondary" : "default"} disabled={isReady(order) || busy} onClick={onReady} aria-label={t("preparation.ready")}
          className={isReady(order) ? "text-success" : "bg-success text-white hover:bg-success/90"}><Check /></Button>
        {minutes > 0 && !isReady(order) && <Countdown since={order.orderDate ?? ""} minutes={minutes} onWarning={() => setWarning(true)} onExpired={() => setOverdue(true)} />}
        <Button type="button" size="icon-sm" variant="ghost" onClick={onPrint} aria-label={t("preparation.printTicket")}><Printer /></Button>
      </div>
      <iframe title={order.orderNumber ?? ""} srcDoc={html} loading="lazy" className="block min-h-0 w-full flex-1 border-0 bg-white" />
      <div className="shrink-0 border-t p-3">
        <div className={cn("flex h-8 items-center justify-center rounded-lg text-xs font-semibold text-white", FOOTER[status])}>
          {t(isReady(order) ? "preparation.statusReady" : late ? "preparation.statusLate" : "preparation.statusPreparing")}
        </div>
      </div>
    </div>
  )
}

/** The kitchen screen: one ticket per order of the open shift, with the time left, a done button and a print button. */
export default function PreparationPage() {
  const { t } = useTranslation()
  const settings = useAppSettings()
  const [search, setSearch] = useState("")
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const { data: orders = [], isFetching, refetch } = usePreparationOrders(search.trim())
  const markReady = useMarkReady()
  const minutes = Number(settings.preparationScreenTab?.autoReadyOrderTimeInMinutes) || 0
  const waiting = orders.filter((o) => !isReady(o)).length

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { /* the browser refused fullscreen: nothing to do */ }
  }, [])

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground sm:rounded-xl sm:border sm:border-border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="outline" size="icon-lg" aria-label={t("preparation.back")}><Link to="/"><Home /></Link></Button>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChefHat /></span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight">{t("preparation.title")}</h1>
            <p className="truncate text-xs text-muted-foreground">{waiting > 0 ? t("preparation.waiting", { count: waiting }) : t("preparation.description")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56 max-w-full">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("preparation.search")} aria-label={t("preparation.search")} className="h-10 ps-9" />
          </div>
          <Button type="button" variant="outline" size="lg" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={isFetching ? "animate-spin" : ""} />{t("preparation.refresh")}</Button>
          <Button type="button" variant="outline" size="icon-lg" onClick={toggleFullscreen} aria-label={t(fullscreen ? "preparation.exitFullscreen" : "preparation.fullscreen")}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {orders.length === 0 ? (
          <EmptyState icon={<ChefHat />} title={t("preparation.empty")} hint={t("preparation.emptyHint")} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((o) => (
              <Ticket key={o.id} order={o} minutes={minutes} busy={markReady.isPending}
                onReady={() => markReady.mutate(o.id)}
                onPrint={() => printDocument(bonDoc(o, ticketOptions(settings, isReady(o) ? "ready" : "pending", "print")))} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
