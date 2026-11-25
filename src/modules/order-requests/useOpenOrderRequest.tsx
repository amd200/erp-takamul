import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { errorToast } from "@/shared/api/errors"
import { useAdditions } from "@/modules/additions/queries"
import { useUnits } from "@/modules/units/queries"
import { newLineKey } from "@/modules/pos/cart"
import { usePosPath } from "@/modules/pos/hooks"
import { usePosStore, type OrderRequestMode } from "@/modules/pos/store"
import type { CartLine } from "@/modules/pos/types"
import { orderRequestKeys } from "./keys"
import { orderRequestsApi } from "./service"
import type { OrderRequestDetails } from "./types"
import { OrderCustomerDialog } from "./components/OrderCustomerDialog"

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
