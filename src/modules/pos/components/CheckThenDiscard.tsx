import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePosStore } from "../store"
import { OrdersDialog } from "./OrdersDialog"
import { salesKeys } from "@/modules/sales/keys"
import { customerKeys } from "@/modules/customers/keys"
import { treasuryKeys } from "@/modules/treasuries/keys"

/** On a locked cart: opens the latest invoices to check whether the unconfirmed sale was saved, and drops it once the cashier confirms it was not, or finishes it (clears the cart, no re-save) when it was. */
export function CheckThenDiscard({ onDiscarded }: { onDiscarded?: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  /** The invoice is in the list: the sale already went through, so just empty the cart like a successful sale does (no re-save). */
  const finish = () => {
    usePosStore.getState().clear()
    for (const queryKey of [salesKeys.all, customerKeys.all, treasuryKeys.all]) qc.invalidateQueries({ queryKey })
    toast.success(t("pos.saved"))
    onDiscarded?.()
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 block font-bold underline underline-offset-2">{t("pos.checkThenDiscard")}</button>
      <OrdersDialog open={open} onOpenChange={setOpen} onFinish={finish} onDiscard={() => { usePosStore.getState().discardPending(); onDiscarded?.() }} />
    </>
  )
}
