import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useSaveOrderRequest } from "@/modules/order-requests/queries"
import { orderRequestBody } from "@/modules/order-requests/service"
import { usePosStore } from "../store"

let leaving: ReturnType<typeof setTimeout> | undefined

/**
 * What the sales screens read while the cart is an order request: the mode and a save that sends it to the server.
 * Leaving the screen drops the request (and its cart), so the next visit is an ordinary sale (the sales screen picks its default customer again). React's dev double mount unmounts and mounts
 * again at once, so the drop waits a tick and a mount cancels it.
 */
export function useOrderRequestMode() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const mode = usePosStore((s) => s.orderRequest)
  const save = useSaveOrderRequest()

  useEffect(() => {
    clearTimeout(leaving)
    return () => { leaving = setTimeout(() => { const s = usePosStore.getState(); if (s.orderRequest) { s.clear(); s.setCustomer(null, "") } }) }
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
