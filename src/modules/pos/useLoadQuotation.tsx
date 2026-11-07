import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { quoteDetailOptions } from "@/modules/quotes/queries"
import type { Quote } from "@/modules/quotes/types"
import { errorToast } from "@/shared/api/errors"
import { usePosStore } from "./store"

/** Both quotation entry points replace the cart only after checking its current state. */
export function useLoadQuotation(onLoaded: () => void) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [replacement, setReplacement] = useState<Quote | null>(null)
  const details = useMutation({
    mutationFn: (id: number) => qc.fetchQuery(quoteDetailOptions(id)),
    onError: (error) => errorToast(error, "common.loadFailed"),
  })

  const cartIsEditable = () => {
    if (usePosStore.getState().save === "idle") return true
    toast.error(t("pos.lockedHint"))
    return false
  }

  const commit = (quote: Quote) => {
    if (!cartIsEditable()) return
    if (usePosStore.getState().loadQuotation(quote)) {
      setReplacement(null)
      onLoaded()
    }
  }

  const load = (id: number) => {
    if (details.isPending || !cartIsEditable()) return
    details.mutate(id, {
      onSuccess: (quote) => {
        if (!cartIsEditable()) return
        if (!quote.items?.length) {
          toast.error(t("quotes.noItemsToLoad"))
          return
        }
        if (usePosStore.getState().lines.length > 0) setReplacement(quote)
        else commit(quote)
      },
    })
  }

  const confirmation = (
    <ConfirmDialog open={!!replacement} onOpenChange={(open) => !open && setReplacement(null)}
      title={t("quotes.replaceCartTitle")} description={t("quotes.replaceCartBody", { number: replacement?.quotationNumber })}
      confirmLabel={t("quotes.openInPos")} onConfirm={() => replacement && commit(replacement)} />
  )

  return { load, confirmation, isLoading: details.isPending, loadingId: details.isPending ? details.variables : undefined }
}
