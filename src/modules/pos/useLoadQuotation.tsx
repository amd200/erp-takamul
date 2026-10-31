import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import type { Quote } from "@/modules/quotes/types"
import { usePosStore } from "./store"

/** Both quotation entry points replace the cart only after checking its current state. */
export function useLoadQuotation(onLoaded: () => void) {
  const { t } = useTranslation()
  const [replacement, setReplacement] = useState<Quote | null>(null)

  const canLoad = (quote: Quote) => {
    if (usePosStore.getState().save !== "idle") {
      toast.error(t("pos.lockedHint"))
      return false
    }
    if ((quote.items ?? []).length === 0) {
      toast.error(t("quotes.noItemsToLoad"))
      return false
    }
    return true
  }

  const commit = (quote: Quote) => {
    if (!canLoad(quote)) return
    if (usePosStore.getState().loadQuotation(quote)) {
      setReplacement(null)
      onLoaded()
    }
  }

  const load = (quote: Quote) => {
    if (!canLoad(quote)) return
    if (usePosStore.getState().lines.length > 0) setReplacement(quote)
    else commit(quote)
  }

  const confirmation = (
    <ConfirmDialog open={!!replacement} onOpenChange={(open) => !open && setReplacement(null)}
      title={t("quotes.replaceCartTitle")} description={t("quotes.replaceCartBody", { number: replacement?.quotationNumber })}
      confirmLabel={t("quotes.openInPos")} onConfirm={() => replacement && commit(replacement)} />
  )

  return { load, confirmation }
}
