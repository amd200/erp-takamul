import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePosStore } from "../store"
import { OrdersDialog } from "./OrdersDialog"

/** On a locked cart: opens the latest invoices to check whether the unconfirmed sale was saved, and drops it once the cashier confirms it was not. */
export function CheckThenDiscard({ onDiscarded }: { onDiscarded?: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 block font-bold underline underline-offset-2">{t("pos.checkThenDiscard")}</button>
      <OrdersDialog open={open} onOpenChange={setOpen} onDiscard={() => { usePosStore.getState().discardPending(); onDiscarded?.() }} />
    </>
  )
}
