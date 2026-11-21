import { useTranslation } from "react-i18next"
import { PartyOpeningBalanceDialog } from "@/modules/partners/components/PartyOpeningBalanceDialog"
import { useSetOpeningBalance } from "../queries"
import type { Customer } from "../types"

/** The customer's opening balance on its own, as in the current system's row button. */
export function OpeningBalanceDialog({ customer, onOpenChange }: { customer: Customer | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const save = useSetOpeningBalance()
  return (
    <PartyOpeningBalanceDialog party={customer} title={t("customers.openingTitle", { name: customer?.customerName })} defaultType="Debit" pending={save.isPending} onOpenChange={onOpenChange}
      onSave={(data) => customer && save.mutate({ id: customer.id, data }, { onSuccess: () => onOpenChange(false) })} />
  )
}
