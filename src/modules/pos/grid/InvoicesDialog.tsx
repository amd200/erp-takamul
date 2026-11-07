import { useMemo, useState } from "react"
import { ChefHat, Clock, CreditCard, FileText, Play, Plus, Printer, QrCode, Search, Trash2, User, X } from "lucide-react"
import { CurrencySymbol } from "../components/CurrencySymbol"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useInvoiceOutput } from "@/modules/sales/print/useInvoiceOutput"
import { useAppSettings } from "@/modules/settings"
import { bonDoc, ticketOptions } from "@/modules/preparation/bon"
import { printDocument } from "@/shared/print"
import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import { badgeOf, useOrderToCart, type Order } from "../components/OrdersDialog"
import { InvoiceQrDialog } from "../components/InvoiceQrDialog"
import { useDeleteHeld } from "../queries"

type Tab = "all" | "completed" | "pending"
const STATUS: Record<Tab, string | null> = { all: null, completed: "Confirmed", pending: "UnConfirmed" }

/**
 * The invoices window of the second sales screen, as in the current POS: All / Invoices / Pending tabs over the latest
 * cashier invoices, a search, and per row print (saved) or back-to-the-cart (pending), plus delete for a held one.
 * As there, each tab asks for the latest 10: the pending tab asks for the held ones, the others for the rest (the server
 * leaves held orders out unless asked). Printing follows the sales screen's invoice type setting.
 */
export function InvoicesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const beauty = useAppSettings().salonsTab?.beautyTheme === true
  const [tab, setTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [qrId, setQrId] = useState<number | null>(null)
  const settings = useAppSettings()
  const invoiceType = settings.salesScreenTab?.sales2InvoiceType
  const paper = invoiceType === 2 ? "roll" : invoiceType === 3 ? "a5" : "a4"
  const isHold = tab === "pending" ? true : tab === "completed" ? false : undefined
  const { data = [], refetch } = useQuery({
    queryKey: ["sales", "pos2-invoices", tab],
    queryFn: async () => (await http<PagedResult<Order>>("/sales-orders", { params: { Page: 1, PageSize: 10, OrderType: "POS", ...(isHold === undefined ? {} : { IsHold: isHold }) } })).items ?? [],
    enabled: open,
    refetchInterval: open && tab === "pending" ? 5000 : undefined,
    refetchOnWindowFocus: true,
  })
  const del = useDeleteHeld()
  const printInvoice = useInvoiceOutput()
  const toCart = useOrderToCart(() => onOpenChange(false))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((o) => {
      const type = STATUS[tab] == null || o.orderStatus === STATUS[tab]
      return type && (!q || o.orderNumber?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.orderStatus?.toLowerCase().includes(q))
    })
  }, [data, search, tab])

  const statusLabel = (s?: string | null) => {
    switch (s?.toLowerCase()) {
      case "confirmed": case "completed": return t("pos1.statusCompleted")
      case "unconfirmed": case "pending": return t("pos1.statusPending")
      case "cancelled": return t("pos1.statusCancelled")
      case "inprogress": return t("pos1.statusInProgress")
      default: return s
    }
  }

  const navy = beauty ? "bg-primary text-primary-foreground" : "bg-[#000052] text-white"
  const icon = "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex flex-col gap-0 overflow-hidden border-border bg-background p-0 text-foreground" style={{ maxWidth: 560, width: "95vw", maxHeight: "88vh" }}>
        <div className={cn("flex shrink-0 items-center justify-between px-4 py-3 dark:bg-secondary", navy)}>
          <div className="flex items-center gap-2">
            <FileText size={15} />
            <DialogTitle className={cn("text-[14px] font-medium", beauty ? "text-primary-foreground!" : "text-white!")}>{t("pos1.invoices")}</DialogTitle>
            <DialogDescription className="sr-only">{t("pos1.invoices")}</DialogDescription>
          </div>
          <button type="button" aria-label={t("common.close")} onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded bg-white/15 transition-colors hover:bg-white/25"><X size={14} /></button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-background px-4 py-3">
          {(["all", "completed", "pending"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={cn("rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all", tab === k ? (beauty ? "border-primary bg-primary text-primary-foreground" : "border-[#000052] bg-[#000052] text-white dark:border-primary dark:bg-primary") : "border-border bg-background text-muted-foreground hover:border-muted hover:bg-muted")}>
              {k === "all" ? t("pos2.all") : k === "completed" ? t("pos1.invoices") : t("pos1.pendingInvoices")}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-2.5">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("pos2.searchInvoices")} aria-label={t("pos2.searchInvoices")}
            className="h-8 w-full flex-1 rounded-lg border border-border bg-muted/50 px-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
          <button type="button" aria-label={t("common.search")} className={cn("flex size-8 items-center justify-center rounded-lg transition-colors", beauty ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-[#000052] text-white hover:bg-[#000052]/90 dark:bg-primary")}><Search size={13} /></button>
        </div>

        <div className="shrink-0 border-b border-border bg-background px-4 py-1.5">
          <span className="text-[11px] text-muted-foreground">{filtered.length} {t("pos2.totalResults")}</span>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">{t("pos2.noInvoices")}</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((o: Order) => {
                const badge = badgeOf(o.orderStatus)
                const label = statusLabel(o.orderStatus)
                const pending = o.orderStatus !== "Confirmed"
                return (
                  <div key={`${o.isHolding ? "h" : "o"}${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-4 py-3 transition-colors hover:bg-muted">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${badge}`}><FileText size={14} /></div>
                    <div className="min-w-0 flex-1 basis-[55%] sm:basis-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><User size={10} />{o.customerName ?? "—"}</span>
                        {label && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge}`}>{label}</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground/60">{o.orderNumber ?? "—"}</span>
                        <span className="text-[10px] text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground"><Clock size={9} />{formatDateTime(o.orderDate, i18n.language)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-between max-sm:ps-11">
                      <span className="flex items-center gap-1 whitespace-nowrap text-[12px] font-bold text-foreground">{(o.grandTotal ?? 0).toFixed(2)}<CurrencySymbol size={11} /></span>
                      <button type="button" title={t("pos2.printPrepTicket")} aria-label={t("pos2.printPrepTicket")} className={icon} onClick={() => printDocument(bonDoc(o, ticketOptions(settings, "pending", "print")))}><ChefHat size={13} /></button>
                      {!pending && !o.isHolding && (
                        <button type="button" title={t("pos1.showQr")} aria-label={t("pos1.showQr")} className={icon} onClick={() => setQrId(o.id)}><QrCode size={13} /></button>
                      )}
                      {!pending ? (
                        <button type="button" aria-label={t("pos2.print")} className={icon} disabled={printInvoice.isPending} onClick={() => printInvoice.mutate({ invoice: { id: o.id }, as: "print", paper })}><Printer size={13} /></button>
                      ) : (
                        <div className="flex items-center gap-x-2">
                          <button type="button" aria-label={t("pos1.completeInvoice")} className={icon} onClick={() => void toCart(o)}><Plus size={13} /></button>
                          <button type="button" title={t("pos2.completePayment")} aria-label={t("pos2.completePayment")} className={icon} onClick={() => void toCart(o)}><CreditCard size={13} /></button>
                        </div>
                      )}
                      {o.orderStatus === "UnConfirmed" && (
                        <button type="button" title={t("pos1.completeInvoice")} aria-label={t("pos1.completeInvoice")} className={icon} onClick={() => void toCart(o)}><Play size={13} /></button>
                      )}
                      {o.isHolding && (
                        <button type="button" title={t("common.delete")} aria-label={t("common.delete")} disabled={del.isPending}
                          onClick={() => { if (window.confirm(t("pos2.deleteHeldConfirm"))) del.mutate(o.id, { onSuccess: () => void refetch() }) }}
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-50"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground">{filtered.length} {t("pos2.invoice")}</span>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-border px-4 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{t("pos1.close")}</button>
        </div>
      </DialogContent>
      <InvoiceQrDialog invoiceId={qrId} onClose={() => setQrId(null)} />
    </Dialog>
  )
}
