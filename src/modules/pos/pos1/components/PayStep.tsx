import { useState } from "react"
import { Handbag, Truck, Utensils, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppSettings } from "@/modules/settings"
import { usePosStore } from "../../store"

/** The names the server stores and prints; they are the same whatever language the screen is in. */
const TYPES: { name: string; key: string; Icon: LucideIcon }[] = [
  { name: "سفري", key: "takeaway", Icon: Handbag },
  { name: "محلي", key: "dineIn", Icon: Utensils },
  { name: "توصيل", key: "delivery", Icon: Truck },
]

/**
 * What the cashier is asked right before paying, when the branch turns it on: the order type label (takeaway sales
 * only; it shows on the printed invoice and does not change the sale). The current POS does not ask for a table here.
 * `start` is called by the pay button; it asks what is needed, then calls `onContinue` (or goes straight on).
 */
export function usePayStep(onContinue: () => void) {
  const sales = useAppSettings().salesScreenTab ?? {}
  const askType = sales.selectOrderTypeDuringSave === true
  const orderType = usePosStore((s) => s.orderType)
  const [step, setStep] = useState<"type" | null>(null)

  const afterType = () => {
    setStep(null)
    onContinue()
  }

  const start = () => {
    if (askType && orderType === "TakeAway") return setStep("type")
    usePosStore.getState().setOrderTypeName(null)
    afterType()
  }

  const dialog = (
    <>
      <OrderTypeDialog open={step === "type"} onOpenChange={(o) => !o && setStep(null)} onPick={(name) => {
        usePosStore.getState().setOrderTypeName(name)
        afterType()
      }} />
    </>
  )
  return { start, dialog }
}

function OrderTypeDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (name: string) => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{t("pos.chooseOrderType")}</DialogTitle>
          <DialogDescription>{t("pos.chooseOrderTypeHint")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          {TYPES.map(({ name, key, Icon }) => (
            <button key={key} type="button" onClick={() => onPick(name)}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 font-semibold transition-colors hover:border-primary hover:bg-primary/5">
              <Icon className="size-6 text-primary" />
              <span>{t(`pos.orderNames.${key}`)}</span>
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
      </DialogContent>
    </Dialog>
  )
}
