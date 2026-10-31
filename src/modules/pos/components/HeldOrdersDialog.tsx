import { useState } from "react"
import { Loader2, PauseCircle, Play, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/EmptyState"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { errorToast } from "@/shared/api/crudQueries"
import { formatMoney, formatDateTime } from "@/lib/format"
import { invoicesApi } from "@/modules/sales/service"
import { editorLineOf } from "@/modules/sales/totals"
import { newLineKey } from "../cart"
import { useDeleteHeld, useHeldOrders } from "../queries"
import { usePosStore } from "../store"
import type { HeldOrder } from "../types"

/** Sales put on hold. Opening one puts its items back in the cart; paying it then turns it into a real sale. */
export function HeldOrdersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { data = [], isLoading } = useHeldOrders(open)
  const del = useDeleteHeld()
  const [loading, setLoading] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<HeldOrder | null>(null)
  const [toResume, setToResume] = useState<HeldOrder | null>(null)
  const cartHasItems = usePosStore((s) => s.lines.length > 0)
  const cartLocked = usePosStore((s) => s.save !== "idle")

  const resume = async (h: HeldOrder) => {
    if (usePosStore.getState().save !== "idle") {
      toast.error(t("pos.lockedHint"))
      return
    }
    setLoading(h.id)
    try {
      const inv = await invoicesApi.get(h.id)
      const loaded = usePosStore.getState().loadHeld(
        h.id,
        (inv.items ?? []).map((l) => ({ ...editorLineOf(l), key: newLineKey(), notes: "", extras: [], imageUrl: null })),
        inv.customerId || null, inv.customerName ?? "", inv.notes ?? "",
      )
      if (loaded) onOpenChange(false)
      else toast.error(t("pos.lockedHint"))
    } catch (e) {
      errorToast(e, "common.loadFailed")
    } finally {
      setLoading(null)
    }
  }

  const requestResume = (h: HeldOrder) => {
    if (usePosStore.getState().lines.length > 0) setToResume(h)
    else void resume(h)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("pos.heldOrders")}</DialogTitle>
            <DialogDescription>{cartHasItems ? t("pos.heldReplaces") : t("pos.heldHint")}</DialogDescription>
          </DialogHeader>
          {isLoading ? <div className="h-32 animate-pulse rounded-xl bg-muted" /> : data.length === 0 ? (
            <EmptyState icon={<PauseCircle />} title={t("pos.noHeld")} hint={t("pos.noHeldHint")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.map((h) => (
                <li key={h.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{h.orderNumber}</div>
                    <div className="truncate text-xs text-muted-foreground">{[h.customerName || t("pos.walkIn"), h.orderDate && formatDateTime(h.orderDate, i18n.language), t("pos.items", { count: (h.items ?? []).length })].filter(Boolean).join(" · ")}</div>
                    {h.notes && <div className="truncate text-xs text-faint">{h.notes}</div>}
                  </div>
                  <span className="font-semibold tabular-nums">{formatMoney(h.grandTotal ?? 0)}</span>
                  <Button type="button" size="icon-lg" aria-label={t("pos.resume")} disabled={loading !== null || cartLocked} onClick={() => requestResume(h)}>{loading === h.id ? <Loader2 className="animate-spin" /> : <Play />}</Button>
                  <Button type="button" variant="ghost" size="icon-lg" aria-label={t("common.delete")} onClick={() => setToDelete(h)} className="hover:bg-destructive-soft hover:text-destructive"><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toResume} onOpenChange={(o) => !o && setToResume(null)}
        title={t("pos.replaceHeldTitle")} description={t("pos.replaceHeldBody", { number: toResume?.orderNumber })} confirmLabel={t("pos.resume")}
        onConfirm={() => { if (toResume) { const held = toResume; setToResume(null); void resume(held) } }} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("pos.deleteHeldTitle")} description={t("pos.deleteHeldBody", { number: toDelete?.orderNumber })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
