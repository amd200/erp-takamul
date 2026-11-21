import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { PaymentsDialog } from "@/components/PaymentsDialog"
import { useCustomer } from "@/modules/customers/queries"
import { useAppSettings } from "@/modules/settings"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useDeletePayment, useInvoicePayments, useRecordPayment } from "../queries"
import type { SalesOrderDto } from "../types"

/** Take a receipt voucher (سند قبض) against a sales invoice, with the vouchers already taken for it. */
export function InvoicePaymentsDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const { data: customer } = useCustomer(invoice?.customerId ?? undefined)
  const { data: payments = [] } = useInvoicePayments(invoice?.id)
  const record = useRecordPayment()
  const remove = useDeletePayment()
  // One key per payment being typed: sending it twice (double click, retry) records it once.
  const key = useRef(newIdempotencyKey())

  return (
    <PaymentsDialog
      open={!!invoice} resetKey={invoice?.id} ready={!!invoice} onOpenChange={onOpenChange}
      title={`${t("sales.receiptTitle")} ${invoice?.orderNumber ?? ""}`} partyLabel={t("sales.customerName")} partyName={invoice?.customerName}
      figureLabel={t("sales.currentBalance")} figure={customer?.balance ?? 0} defaultVault={useAppSettings().sales?.defaultSalesVault}
      payments={payments.map((p) => ({ ...p, treasuryName: p.transactionName }))}
      texts={{ submit: t("sales.saveReceipt"), empty: t("sales.noPayments"), deleteTitle: t("sales.deleteReceiptTitle"), deleteName: t("sales.receiptName") }}
      recordPending={record.isPending} deletePending={remove.isPending}
      onSubmit={(v, done) => invoice && record.mutate(
        { invoiceId: invoice.id, payment: { amount: v.amount, treasuryId: v.treasuryId, method: "Cash", notes: t("sales.receiptNote", { number: invoice.orderNumber, lng: "ar" }) }, key: key.current },
        { onSuccess: () => { key.current = newIdempotencyKey(); done() }, onError: renewIfReused(key) },
      )}
      onDelete={(id, done) => remove.mutate(id, { onSuccess: done })}
    />
  )
}
