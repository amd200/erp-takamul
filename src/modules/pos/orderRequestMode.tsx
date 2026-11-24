import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { errorToast } from "@/shared/api/errors"
import { useAdditions } from "@/modules/additions/queries"
import { useUnits } from "@/modules/units/queries"
import { orderRequestKeys } from "@/modules/order-requests/keys"
import { useSaveOrderRequest } from "@/modules/order-requests/queries"
import { orderRequestBody, orderRequestsApi } from "@/modules/order-requests/service"
import type { OrderRequestDetails } from "@/modules/order-requests/types"
import { newLineKey } from "./cart"
import { usePosPath } from "./hooks"
import { OrderCustomerDialog } from "./OrderCustomerDialog"
import { usePosStore, type OrderRequestMode } from "./store"
import type { CartLine } from "./types"

/**
 * The "add order" / "edit order" buttons of the orders list. Both open the branch's sales screen with the cart working as an
 * order request (see `useOrderRequestMode`); an existing order is read from the server, additions and notes included.
 * A cart that already has items is replaced only after the cashier agrees.
 */
export function useOpenOrderRequest() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const nav = useNavigate()
  const path = usePosPath()
  const { data: units = [] } = useUnits()
  const { data: additions = [] } = useAdditions()
  const [choosing, setChoosing] = useState(false)
  const [pending, setPending] = useState<{ mode: OrderRequestMode; lines?: CartLine[]; customerId?: number | null; customerName?: string; note?: string } | null>(null)

  const unlocked = () => {
    if (usePosStore.getState().save === "idle") return true
    toast.error(t("pos.lockedHint"))
    return false
  }
  const commit = (start: NonNullable<typeof pending>) => {
    if (!unlocked()) return
    if (usePosStore.getState().startOrderRequest(start)) { setPending(null); nav(path) }
  }
  const begin = (start: NonNullable<typeof pending>) => {
    if (!unlocked()) return
    if (usePosStore.getState().lines.length > 0) setPending(start)
    else commit(start)
  }

  const linesOf = (o: OrderRequestDetails): CartLine[] => (o.items ?? []).map((i) => ({
    key: newLineKey(), productId: i.productId ?? 0, unitId: i.unitId ?? 0, productName: i.productName ?? "", unitName: units.find((u) => u.id === i.unitId)?.name ?? "",
    quantity: i.quantity, unitPrice: i.unitPrice ?? 0, taxPercentage: i.taxPercentage ?? 0, taxCalculation: 2,
    discountKind: (i.discountPercentage ?? 0) > 0 ? "percent" : "value", discount: (i.discountPercentage ?? 0) > 0 ? i.discountPercentage ?? 0 : i.discountValue ?? 0,
    notes: i.notes ?? "", extras: (i.additionIds ?? []).map((id) => ({ id, name: additions.find((a) => a.id === id)?.additionNameAr ?? "" })), imageUrl: null,
  }))

  const details = useMutation({
    mutationFn: (id: number) => qc.fetchQuery({ queryKey: orderRequestKeys.detail(id), queryFn: () => orderRequestsApi.get(id), staleTime: 0 }),
    onError: (e) => errorToast(e, "common.loadFailed"),
    onSuccess: (o) => {
      if (!o.items?.length) return void toast.error(t("orderRequests.noItemsToLoad"))
      begin({
        mode: { id: o.id, number: o.orderNumber ?? null },
        lines: linesOf(o), customerId: o.customerId ?? null, customerName: o.customerId ? o.customerName ?? "" : "", note: o.notes ?? "",
      })
    },
  })

  const confirmation = (
    <>
    <OrderCustomerDialog open={choosing} onOpenChange={setChoosing} onContinue={(c) => { setChoosing(false); begin({ mode: { id: null, number: null }, customerId: c.id, customerName: c.name }) }} />
    <ConfirmDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}
      title={t("orderRequests.replaceCartTitle")} description={t("orderRequests.replaceCartBody")}
      confirmLabel={t("orderRequests.openInPos")} onConfirm={() => pending && commit(pending)} />
    </>
  )
  return {
    add: () => { if (unlocked()) setChoosing(true) },
    edit: (id: number) => { if (!details.isPending) details.mutate(id) },
    confirmation,
  }
}

let leaving: ReturnType<typeof setTimeout> | undefined

/**
 * What the sales screens read while the cart is an order request: the mode and a save that sends it to the server.
 * Leaving the screen drops the request (and its cart), so the next visit is an ordinary sale. React's dev double mount unmounts and mounts
 * again at once, so the drop waits a tick and a mount cancels it.
 */
export function useOrderRequestMode() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const mode = usePosStore((s) => s.orderRequest)
  const save = useSaveOrderRequest()

  useEffect(() => {
    clearTimeout(leaving)
    return () => { leaving = setTimeout(() => { if (usePosStore.getState().orderRequest) usePosStore.getState().clear() }) }
  }, [])

  return {
    mode,
    saving: save.isPending,
    save: () => {
      const s = usePosStore.getState()
      if (!s.orderRequest) return
      if (s.lines.length === 0) return void toast.error(t("pos1.addItems"))
      // The customer is always a registered one (an old order with only a name and phone gets one picked here).
      if (!s.customerId) return void toast.error(t("orderRequests.customerRequired"))
      // The order has no invoice-wide discount; only each line's own.
      if (s.discount.value > 0) return void toast.error(t("orderRequests.discountNotSupported"))
      save.mutate({ id: s.orderRequest.id ?? undefined, data: orderRequestBody({ lines: s.lines, customerId: s.customerId, note: s.note }) }, {
        onSuccess: () => { usePosStore.getState().clear(); nav("/orders") },
      })
    },
  }
}
