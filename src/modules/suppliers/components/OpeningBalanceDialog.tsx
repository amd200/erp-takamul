import { useTranslation } from "react-i18next"
import { PartyOpeningBalanceDialog } from "@/modules/partners/components/PartyOpeningBalanceDialog"
import { useSetSupplierOpeningBalance } from "../queries"
import type { Supplier } from "../types"

/** The supplier's opening balance on its own, as in the current system's row button. */
export function OpeningBalanceDialog({ supplier, onOpenChange }: { supplier: Supplier | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const save = useSetSupplierOpeningBalance()
  return (
    <PartyOpeningBalanceDialog party={supplier} title={t("suppliers.openingTitle", { name: supplier?.supplierName })} defaultType="Credit" pending={save.isPending} onOpenChange={onOpenChange}
      onSave={(data) => supplier && save.mutate({ id: supplier.id, data }, { onSuccess: () => onOpenChange(false) })} />
  )
}
