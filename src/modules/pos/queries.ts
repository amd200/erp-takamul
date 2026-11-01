import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { ApiError } from "@/shared/http/ApiError"
import { useAuthStore } from "@/shared/auth/authStore"
import { currentShift } from "@/modules/shifts/service"
import { tableKeys } from "@/modules/tables/queries"
import { invoicesApi } from "@/modules/sales/service"
import { posApi } from "./service"
import type { SaleInput, SaleResult } from "./types"
import { usePosStore } from "./store"

export const posKeys = { shift: ["shifts", "current"] as const, held: ["pos", "held"] as const, delivery: ["pos", "delivery"] as const }

export const useCurrentShift = () => useQuery({ queryKey: posKeys.shift, queryFn: currentShift })
export const useHeldOrders = (enabled = true) => useQuery({ queryKey: posKeys.held, queryFn: posApi.held, enabled })
/** The latest number plus one, keeping its prefix ("SO-D1-000041" → "SO-D1-000042"). */
const nextNumber = (last?: string) => {
  if (!last) return "SO-D1-000001"
  const cut = last.lastIndexOf("-") + 1
  return `${last.slice(0, cut)}${String((parseInt(last.slice(cut), 10) || 0) + 1).padStart(6, "0")}`
}
/** What the next cashier invoice will most likely be numbered; the server assigns the real number on saving. */
export const useNextInvoiceNumber = () => useQuery({
  queryKey: ["sales", "invoices", "next-pos"],
  queryFn: async () => nextNumber((await invoicesApi.page({ page: 1, pageSize: 1, channel: "POS" })).items[0]?.orderNumber ?? undefined),
  refetchOnWindowFocus: true,
})
export const useDeliveryCompanies = (enabled: boolean) => useQuery({ queryKey: posKeys.delivery, queryFn: posApi.deliveryCompanies, enabled, staleTime: 5 * 60_000 })

/** No answer, or a server failure after which the sale may already exist: only retrying with the same key is safe. */
const isUnsure = (e: unknown) => e instanceof ApiError && (e.status === 0 || e.status >= 500 || e.code === "IDEMPOTENCY_IN_PROGRESS" || e.code === "IDEMPOTENCY_KEY_REUSED")

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }

export type SaleRequest = Omit<SaleInput, "orderDate" | "holding"> & { holding?: boolean }

/**
 * Sends the cart. The cart locks while the request runs; a clear refusal unlocks it, an unclear failure
 * keeps it locked with the same key so pressing pay again cannot save the sale twice.
 */
export function useSaveSale({ message }: { message?: string } = {}) {
  const qc = useQueryClient()
  return useMutation<SaleResult, unknown, { sale: SaleRequest }>({
    mutationFn: async ({ sale }) => {
      const { key, orderDate } = usePosStore.getState().beginSave(useAuthStore.getState().session?.userId ?? null, today())
      const input: SaleInput = { ...sale, holding: !!sale.holding, orderDate }
      try {
        if (sale.orderType === "InDine") {
          return sale.dineInMode === "checkout" ? await posApi.dineIn.checkout(input, key) : sale.dineInMode === "add-items" ? await posApi.dineIn.update(input) : await posApi.dineIn.create(input, key)
        }
        return sale.holdingOrderId && !sale.holding ? await posApi.release(sale.holdingOrderId, sale.payments, key) : await posApi.save(input, key)
      } catch (e) {
        if (isUnsure(e)) usePosStore.getState().saveUncertain()
        else usePosStore.getState().saveRejected()
        throw e
      }
    },
    onSuccess: (_r, { sale }) => {
      usePosStore.getState().clear()
      qc.invalidateQueries({ queryKey: posKeys.held })
      qc.invalidateQueries({ queryKey: ["sales"] })
      qc.invalidateQueries({ queryKey: ["customers"] })
      qc.invalidateQueries({ queryKey: ["treasuries"] })
      qc.invalidateQueries({ queryKey: tableKeys.all })
      const sentToKitchen = sale.orderType === "InDine" && sale.dineInMode !== "checkout"
      toast.success(message ?? i18n.t(sale.holding ? "pos.held" : sentToKitchen ? "posTables.sent" : "pos.saved"))
    },
    onError: (e) => {
      if (isUnsure(e)) toast.error(i18n.t("pos.unsure"))
      else errorToast(e, "common.saveFailed")
    },
  })
}

export const useDeleteHeld = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => posApi.deleteHeld(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: posKeys.held }); toast.success(i18n.t("common.deleted")) },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
