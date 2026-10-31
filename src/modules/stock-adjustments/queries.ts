import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { productKeys } from "@/modules/products/queries"
import { adjustmentsApi } from "./service"
import type { AdjustmentInput } from "./types"

export const adjustmentKeys = { all: ["adjustments"] as const }

export const useAdjustments = () => useQuery({ queryKey: adjustmentKeys.all, queryFn: adjustmentsApi.list })

/** Saving an adjustment changes stock, so item lists refresh too. */
export function useCreateAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AdjustmentInput) => adjustmentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.all })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast.success(i18n.t("stock.saved"))
    },
    onError: () => toast.error(i18n.t("common.saveFailed")),
  })
}
