import { useTranslation } from "react-i18next"
import { PaymentsDialog } from "@/components/PaymentsDialog"
import { useAppSettings } from "@/modules/settings"
import { useDeletePurchasePayment, usePurchase, useRecordPurchasePayment } from "../queries"

/** Pay a supplier against a purchase invoice (from the purchases list), with the payments already made. */
export function PurchasePaymentsDialog({ purchaseId, onOpenChange }: { purchaseId: number | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { data: purchase } = usePurchase(purchaseId ?? undefined)
  const record = useRecordPurchasePayment()
  const remove = useDeletePurchasePayment()
  const remaining = purchase?.remainingAmount ?? 0

  return (
    <PaymentsDialog
      open={!!purchaseId} resetKey={purchaseId} ready={!!purchase && purchase.id === purchaseId} onOpenChange={onOpenChange}
      title={`${t("purchases.paymentsTitle")} ${purchase?.purchaseOrderNumber ?? ""}`} partyLabel={t("purchases.supplier")} partyName={purchase?.supplierName}
      figureLabel={t("purchases.remaining")} figure={remaining} defaultVault={useAppSettings().sales?.defaultPurchasesVault} initialAmount={remaining}
      payments={purchase?.payments ?? []}
      texts={{ submit: t("purchases.addPayment"), empty: t("sales.noPayments"), deleteTitle: t("purchases.deletePayment"), deleteName: t("purchases.paymentName") }}
      recordPending={record.isPending} deletePending={remove.isPending}
      onSubmit={(v, done) => purchase && record.mutate(
        { id: purchase.id, treasuryId: v.treasuryId, amount: v.amount, paymentDate: v.paymentDate, notes: t("purchases.paymentNote", { number: purchase.purchaseOrderNumber, lng: "ar" }) },
        { onSuccess: done },
      )}
      onDelete={(id, done) => remove.mutate(id, { onSuccess: done })}
    />
  )
}
