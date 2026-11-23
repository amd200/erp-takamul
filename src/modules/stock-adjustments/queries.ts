import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { useDebounced } from "@/modules/products/lookup"
import { productKeys } from "@/modules/products/keys"
import { adjustmentsApi } from "./service"
import { formatDateTime } from "@/lib/format"
import { downloadPdf, printDocument } from "@/shared/print"
import { adjustmentDoc } from "./print/adjustmentDoc"
import type { AdjustmentDto, AdjustmentInput } from "./types"
import { adjustmentKeys } from "./keys"

export const useAdjustments = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? [...adjustmentKeys.all, sort] : adjustmentKeys.all, queryFn: () => adjustmentsApi.list(sort), placeholderData: keepPreviousData })

/** Saving an adjustment changes stock, so item lists refresh too. */
export function useCreateAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AdjustmentInput) => adjustmentsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.all })
      qc.invalidateQueries({ queryKey: productKeys.all })
      qc.invalidateQueries({ queryKey: adjustmentKeys.stockRows })
      toast.success(i18n.t("stock.saved"))
    },
    onError: () => toast.error(i18n.t("common.saveFailed")),
  })
}

/** Stock rows (item + warehouse) matching what is typed; an empty term lists the first page. */
export function useStockSearch(term: string, enabled = true) {
  const settled = useDebounced(term.trim())
  return useQuery({ queryKey: adjustmentKeys.stock(settled), queryFn: () => adjustmentsApi.stock(settled), enabled, placeholderData: keepPreviousData, staleTime: 30_000 })
}

/** Editing an adjustment reverses its old lines and applies the new ones on the server, so stock lists refresh too. */
export function useUpdateAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdjustmentInput }) => adjustmentsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.all })
      qc.invalidateQueries({ queryKey: adjustmentKeys.stockRows })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast.success(i18n.t("stock.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

/** Deleting an adjustment removes it from the list (the server decides about stock). */
export const useDeleteAdjustment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adjustmentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adjustmentKeys.all })
      qc.invalidateQueries({ queryKey: adjustmentKeys.stockRows })
      qc.invalidateQueries({ queryKey: productKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

/** Print an adjustment, or save it as a PDF; the page is built here from the saved adjustment (the server has no print endpoint for it). */
export function useAdjustmentOutput() {
  return useMutation({
    mutationFn: async ({ adjustment, as }: { adjustment: AdjustmentDto; as: "print" | "pdf" }) => {
      const doc = adjustmentDoc(adjustment, formatDateTime(adjustment.operationDate ?? "", i18n.language))
      return as === "print" ? printDocument(doc) : downloadPdf(doc, `${doc.title}.pdf`)
    },
    onError: () => toast.error(i18n.t("adjForm.printFailed")),
  })
}
