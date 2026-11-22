import { useTranslation } from "react-i18next"
import { PaymentsDialog } from "@/components/PaymentsDialog"
import { useCustomer } from "@/modules/customers/queries"
import { useAppSettings } from "@/modules/settings"
import { useDeleteRefund, useRecordRefund, useReturn } from "../queries"

/** Pay a refund to the customer against a sales return, with the refunds already paid for it. */
export function ReturnRefundsDialog({ returnId, onOpenChange }: { returnId: number | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { data: ret } = useReturn(returnId ?? undefined)
  const { data: customer } = useCustomer(ret?.customerId ?? undefined)
  const record = useRecordRefund()
  const remove = useDeleteRefund()
  const remaining = Math.max((ret?.grandTotal ?? 0) - (ret?.refundedAmount ?? 0), 0)

  return (
    <PaymentsDialog
      open={!!returnId} resetKey={returnId} ready={!!returnId && ret?.id === returnId} onOpenChange={onOpenChange}
      title={`${t("sales.refundsTitle")} ${ret?.returnNumber ?? ""}`} partyLabel={t("sales.customerName")} partyName={ret?.customerName}
      figureLabel={t("sales.currentBalance")} figure={customer?.balance ?? 0} defaultVault={useAppSettings().sales?.defaultSalesVault} initialAmount={remaining}
      payments={ret?.payments ?? []}
      texts={{ submit: t("sales.addRefund"), empty: t("sales.noRefunds"), deleteTitle: t("sales.deleteRefundTitle"), deleteName: t("sales.refundName") }}
      recordPending={record.isPending} deletePending={remove.isPending}
      onSubmit={(v, done) => ret && record.mutate({ id: ret.id, treasuryId: v.treasuryId, amount: v.amount, paymentDate: v.paymentDate }, { onSuccess: done })}
      onDelete={(paymentId, done) => ret && remove.mutate({ id: ret.id, paymentId }, { onSuccess: done })}
    />
  )
}
