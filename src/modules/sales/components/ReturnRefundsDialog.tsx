import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { PaymentsDialog } from "@/components/PaymentsDialog"
import { useCustomer } from "@/modules/customers/queries"
import { useAppSettings } from "@/modules/settings"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useDeleteRefund, useRecordRefund, useReturn } from "../queries"

/** Pay a refund to the customer against a sales return, with the refunds already paid for it. */
export function ReturnRefundsDialog({ returnId, onOpenChange }: { returnId: number | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { data: ret } = useReturn(returnId ?? undefined)
  const { data: customer } = useCustomer(ret?.customerId ?? undefined)
  const record = useRecordRefund()
  const remove = useDeleteRefund()
  // Recording and deleting a refund need the permission to add sales returns, as the server requires.
  const canEdit = useCan()(P.sales.returnsAdd)
  // One key per refund being typed, and one per refund being deleted.
  const key = useRef(newIdempotencyKey())
  const deleteKey = useRef(newIdempotencyKey())
  const deleteId = useRef(0)
  const remaining = Math.max((ret?.grandTotal ?? 0) - (ret?.refundedAmount ?? 0), 0)

  return (
    <PaymentsDialog
      open={!!returnId} resetKey={returnId} ready={!!returnId && ret?.id === returnId} onOpenChange={onOpenChange}
      title={`${t("sales.refundsTitle")} ${ret?.returnNumber ?? ""}`} partyLabel={t("sales.customerName")} partyName={ret?.customerName}
      figureLabel={t("sales.currentBalance")} figure={customer?.balance ?? 0} defaultVault={useAppSettings().sales?.defaultSalesVault} initialAmount={remaining}
      payments={ret?.payments ?? []}
      texts={{ submit: t("sales.addRefund"), empty: t("sales.noRefunds"), deleteTitle: t("sales.deleteRefundTitle"), deleteName: t("sales.refundName") }}
      recordPending={record.isPending} deletePending={remove.isPending}
      readOnly={!canEdit}
      onSubmit={(v, done) => ret && record.mutate(
        { id: ret.id, treasuryId: v.treasuryId, amount: v.amount, paymentDate: v.paymentDate, key: key.current },
        { onSuccess: () => { key.current = newIdempotencyKey(); done() }, onError: renewIfReused(key) },
      )}
      onDelete={(paymentId, done) => {
        if (!ret) return
        if (deleteId.current !== paymentId) { deleteId.current = paymentId; deleteKey.current = newIdempotencyKey() }
        remove.mutate({ id: ret.id, paymentId, key: deleteKey.current }, { onSuccess: () => { deleteId.current = 0; deleteKey.current = newIdempotencyKey(); done() }, onError: renewIfReused(deleteKey) })
      }}
    />
  )
}
