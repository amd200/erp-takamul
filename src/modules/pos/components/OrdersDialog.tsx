import { useMemo, useState } from "react"
import { BellRing, Clock, CreditCard, FileText, Loader2, Plus, Printer, QrCode, Search, Trash2, User, X } from "lucide-react"
import { CurrencySymbol } from "./CurrencySymbol"
import { InvoiceQrDialog } from "./InvoiceQrDialog"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/format"
import { errorToast } from "@/shared/api/errors"
import { invoicesApi } from "@/modules/sales/service"
import { editorLineOf } from "@/modules/sales/totals"
import { useInvoiceOutput } from "@/modules/sales/print/useInvoiceOutput"
import { useAppSettings } from "@/modules/settings"
import { dineInLineOf, newLineKey } from "../cart"
import { useDeleteHeld, usePosOrders } from "../queries"
import { badgeOf, matchesOrderSearch, statusLabel } from "../orderStatus"
import type { Order } from "../types"
import { usePosStore } from "../store"
import { posKeys } from "../keys"
import { salesKeys } from "@/modules/sales/keys"
import { useSendInvoiceNotification } from "@/modules/public-invoice/queries"

type Tab = "completed" | "pending" | "tables"

/** A held order goes back to the cart as it was saved: lines, customer, discount, note, pager and service employee. */
export function useOrderToCart(done: () => void) {
  const { t } = useTranslation()
  return async (o: { id: number }) => {
    const pos = usePosStore.getState()
    if (pos.save !== "idle") return toast.error(t("pos.lockedHint"))
    try {
      const inv = (await invoicesApi.get(o.id)) as Order
      // A table's open order is paid on its table; the held-order release does not apply to it.
      if (inv.orderType === "InDine") {
        if (inv.orderStatus !== "InProgress" || !inv.tableId) return
        if (!pos.startDineIn({ mode: "checkout", tableId: inv.tableId, orderId: inv.id, lines: (inv.items ?? []).map(dineInLineOf), customerId: inv.customerId || null, customerName: inv.customerName ?? "", note: inv.notes ?? "", orderDeviceNumber: inv.orderDeviceNumber ? String(inv.orderDeviceNumber) : null, employeeId: inv.employeeId })) return
        return done()
      }
      if (!pos.loadHeld(o.id, (inv.items ?? []).map((l) => ({ ...editorLineOf(l), key: newLineKey(), notes: "", extras: [], imageUrl: null })), inv.customerId || null, inv.customerName ?? "", inv.notes ?? "")) return
      const s = usePosStore.getState()
      if (inv.discountAmount) s.setDiscount({ kind: "value", value: inv.discountAmount })
      if (inv.orderType === "TakeAway" || inv.orderType === "Delivery") s.setOrderType(inv.orderType)
      s.setOrderDeviceNumber(inv.orderDeviceNumber ? String(inv.orderDeviceNumber) : null)
      if (inv.employeeId) s.setEmployee(inv.employeeId)
      done()
    } catch (e) {
      errorToast(e, "common.loadFailed")
    }
  }
}

/**
 * The orders window of the current POS: the latest invoices (print) and the held ones (back to the cart, or delete).
 * With `onlySuspended` it lists the held ones alone, as the pause button in the cart opens it.
 * With `onDiscard` it is opened from a locked cart to check whether the unconfirmed sale was saved, and offers to drop it.
 */
export function OrdersDialog({ open, onOpenChange, onlySuspended = false, onDiscard, onFinish }: { open: boolean; onOpenChange: (o: boolean) => void; onlySuspended?: boolean; onDiscard?: () => void; onFinish?: () => void }) {
  const { t, i18n } = useTranslation()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [tab, setTab] = useState<Tab>("completed")
  const [search, setSearch] = useState("")
  const [qrId, setQrId] = useState<number | null>(null)
  // The send button and the customer's QR follow the branch setting notificationsTab.enableNotifications.
  const notificationsOn = useAppSettings().notificationsTab?.enableNotifications === true
  const sendNotification = useSendInvoiceNotification()
  const held = onlySuspended || tab === "pending"
  const showTables = useAppSettings().salesScreenTab?.isTables === true
  const tables = !onlySuspended && tab === "tables"
  const { data = [] } = usePosOrders({
    queryKey: held ? posKeys.held : tables ? salesKeys.posTables : salesKeys.posLatest,
    held,
    size: held || tables ? 100 : 10,
    enabled: open,
    poll: held,
  })
  const del = useDeleteHeld()
  const printInvoice = useInvoiceOutput()

  const filtered = useMemo(() => {
    return data.filter((o) => {
      if (onlySuspended) return o.orderStatus === "UnConfirmed"
      const match = matchesOrderSearch(o, search)
      if (tab === "tables") return o.orderType === "InDine" && !o.isHolding && match
      const status = tab === "completed" ? "Confirmed" : "UnConfirmed"
      return match && (o.orderStatus === status || (tab === "completed" && o.orderStatus?.toLowerCase() === "readyfordelivery"))
    })
  }, [data, search, tab, onlySuspended])

  const toCart = useOrderToCart(() => onOpenChange(false))

  const icon = "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} className="flex flex-col gap-0 overflow-hidden rounded-2xl border-border bg-background p-0 text-foreground" style={{ maxWidth: 580, width: "95vw", maxHeight: "88vh" }}>
        <div className="flex shrink-0 items-center justify-between border-b border-sidebar-foreground/10 bg-sidebar px-4 py-3">
          <DialogTitle className="text-[14px] font-semibold text-sidebar-foreground">{onlySuspended ? t("pos1.suspendedInvoices") : t("pos.orders")}</DialogTitle>
          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-lg bg-sidebar-foreground/10 text-sidebar-foreground transition-colors hover:bg-sidebar-foreground/20"><X size={14} /></button>
        </div>

        {!onlySuspended && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border bg-card px-4 py-3">
              {(showTables ? ["completed", "pending", "tables"] as const : ["completed", "pending"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${tab === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
                  {k === "completed" ? t("pos1.invoices") : k === "pending" ? t("pos1.pendingInvoices") : t("posTables.tables")}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-2.5">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("pos1.searchOrders")}
                className="h-8 w-full flex-1 rounded-lg border border-border bg-background px-3 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" />
              <button type="button" className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/80"><Search size={13} /></button>
            </div>
          </>
        )}

        <div className="shrink-0 border-b border-border bg-card px-4 py-1.5">
          <span className="text-[11px] text-muted-foreground">{filtered.length} {onlySuspended ? t("pos1.suspendedInvoices") : t("pos1.order")}</span>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">{t("pos1.noOrders")}</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((o) => {
                const badge = badgeOf(o.orderStatus)
                const label = statusLabel(t, o.orderStatus)
                return (
                  <div key={o.id} className="flex w-full flex-col justify-between gap-3 border-b border-border/50 bg-card px-4 py-3.5 text-right transition-colors hover:bg-muted sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full sm:mt-0 ${badge}`}><FileText size={14} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:justify-start">
                          <span className="truncate text-[12px] font-semibold text-primary">{o.orderNumber}</span>
                          {label && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge}`}>{label}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><User size={10} />{o.customerName ?? "—"}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{formatDateTime(o.orderDate, i18n.language)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="my-0.5 w-full border-t border-dashed border-border/60 sm:hidden" />
                    <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:justify-end">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="mb-0.5 text-[9px] font-medium text-muted-foreground sm:hidden">{t("pos1.total")}</span>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-foreground">{(o.grandTotal ?? 0).toFixed(2)}<CurrencySymbol size={11} /></span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {notificationsOn && !held && o.orderStatus === "Confirmed" && !o.isHolding && (
                          <button type="button" title={t("invTrack.send")} aria-label={t("invTrack.send")} className={icon} disabled={sendNotification.isPending} onClick={() => sendNotification.mutate(o.id)}>
                            {sendNotification.isPending && sendNotification.variables === o.id ? <Loader2 size={15} className="animate-spin" /> : <BellRing size={15} />}
                          </button>
                        )}
                        {notificationsOn && !held && o.orderStatus === "Confirmed" && !o.isHolding && (
                          <button type="button" title={t("pos1.showQr")} aria-label={t("pos1.showQr")} className={icon} onClick={() => setQrId(o.id)}><QrCode size={15} /></button>
                        )}
                        {!held && o.orderStatus !== "Cancelled" && (
                          <button type="button" className={icon} disabled={printInvoice.isPending} onClick={() => printInvoice.mutate({ invoice: { id: o.id }, as: "print", paper: "roll" }, { onSuccess: () => onOpenChange(false) })}><Printer size={15} /></button>
                        )}
                        {tables && o.orderStatus === "InProgress" && <button type="button" title={t("posTables.proceedToPayment")} aria-label={t("posTables.proceedToPayment")} className={icon} onClick={() => void toCart(o)}><CreditCard size={15} /></button>}
                        {held && <button type="button" title={t("pos1.completeInvoice")} className={icon} onClick={() => void toCart(o)}><Plus size={15} /></button>}
                        {o.isHolding && (
                          <button type="button" title={t("common.delete")} aria-label={t("common.delete")} disabled={del.isPending} onClick={() => del.mutate(o.id)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-50"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground">{filtered.length} {t("pos1.order")}</span>
          <div className="flex items-center gap-2">
            {onFinish && <button type="button" onClick={() => setConfirmFinish(true)} className="rounded border border-primary/30 px-3 py-1.5 text-[11px] text-primary transition-colors hover:bg-primary/10">{t("pos.finishPending")}</button>}
            {onDiscard && <button type="button" onClick={() => setConfirmDiscard(true)} className="rounded border border-destructive/30 px-3 py-1.5 text-[11px] text-destructive transition-colors hover:bg-destructive/10">{t("pos.discardPending")}</button>}
            <button type="button" onClick={() => onOpenChange(false)} className="rounded border border-border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">{t("pos1.close")}</button>
          </div>
        </div>
      </DialogContent>
      <InvoiceQrDialog invoiceId={qrId} notifications={notificationsOn} onClose={() => setQrId(null)} />
      {onFinish && (
        <ConfirmDialog open={confirmFinish} onOpenChange={setConfirmFinish} title={t("pos.finishTitle")} description={t("pos.finishDesc")} confirmLabel={t("pos.finishConfirm")}
          onConfirm={() => { setConfirmFinish(false); onFinish(); onOpenChange(false) }} />
      )}
      {onDiscard && (
        <ConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title={t("pos.discardTitle")} description={t("pos.discardDesc")} confirmLabel={t("pos.discardConfirm")}
          onConfirm={() => { setConfirmDiscard(false); onDiscard(); onOpenChange(false) }} />
      )}
    </Dialog>
  )
}
