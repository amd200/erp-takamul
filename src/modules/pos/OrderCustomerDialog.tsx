import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { CustomerPicker } from "./components/CustomerPicker"

/** The first step of a new order: who it is for, an existing customer or a new one, or nobody. Then the sales screen opens for the items. */
export function OrderCustomerDialog({ open, onOpenChange, onContinue }: { open: boolean; onOpenChange: (o: boolean) => void; onContinue: (customer: { id: number; name: string } | null) => void }) {
  const { t } = useTranslation()
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const close = (o: boolean) => { if (!o) setCustomer(null); onOpenChange(o) }
  const go = (c: { id: number; name: string } | null) => { setCustomer(null); onContinue(c) }
  return (
    <>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("orderRequests.stepTitle")}</DialogTitle>
            <DialogDescription>{t("orderRequests.stepHint")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <CustomerPicker tools={false} customerId={customer?.id ?? null} name={customer?.name ?? ""} onPick={(id, name) => setCustomer(id ? { id, name } : null)} />
              </div>
              <Button type="button" variant="outline" size="icon-lg" aria-label={t("customers.add")} title={t("customers.add")} onClick={() => setAdding(true)}><Plus /></Button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => go(null)}>{t("orderRequests.withoutCustomer")}</Button>
            <Button type="button" disabled={!customer} onClick={() => go(customer)}>{t("orderRequests.continue")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CustomerDialog open={adding} onOpenChange={setAdding} onCreated={(id, name) => setCustomer({ id, name })} />
    </>
  )
}
