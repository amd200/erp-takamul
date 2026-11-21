import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { formatMoney, formatDateTime } from "@/lib/format"
import { useCustomer } from "@/modules/customers/queries"
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useDeletePayment, useInvoicePayments, useRecordPayment, useUpdatePayment } from "../queries"
import { receiptAmountSchema, receiptFormSchema, today, type ReceiptAmountForm, type ReceiptForm } from "../schema"
import type { InvoicePaymentItem, SalesOrderDto } from "../types"

/** Add a receipt voucher (سند قبض) against an invoice, with the vouchers already taken for it. */
export function PaymentsDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const { data: customer } = useCustomer(invoice?.customerId ?? undefined)
  const { data: payments = [] } = useInvoicePayments(invoice?.id)
  const record = useRecordPayment()
  const remove = useDeletePayment()
  const update = useUpdatePayment()
  const [toEdit, setToEdit] = useState<InvoicePaymentItem | null>(null)
  const editForm = useForm<ReceiptAmountForm>({ resolver: zodResolver(receiptAmountSchema), defaultValues: { amount: 0 } })
  const [toDelete, setToDelete] = useState<InvoicePaymentItem | null>(null)
  const defaultVault = useAppSettings().sales?.defaultSalesVault
  const form = useForm<ReceiptForm>({ resolver: zodResolver(receiptFormSchema), defaultValues: { date: today(), treasuryId: 0, amount: 0 } })
  // One key per payment being typed: sending it twice (double click, retry) records it once.
  const key = useRef(newIdempotencyKey())

  useEffect(() => { if (invoice) form.reset({ date: today(), treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, amount: 0 }) }, [invoice?.id, form, treasuries, defaultVault]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = form.handleSubmit((v) => invoice && record.mutate(
    { invoiceId: invoice.id, payment: { amount: v.amount, treasuryId: v.treasuryId, method: "Cash", notes: t("sales.receiptNote", { number: invoice.orderNumber, lng: "ar" }) }, key: key.current },
    { onSuccess: () => { key.current = newIdempotencyKey(); onOpenChange(false) }, onError: renewIfReused(key) },
  ))

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t("sales.receiptTitle")}</DialogTitle></DialogHeader>
        <DialogBody>
          {invoice && (
            <>
              <form id="payment-form" onSubmit={submit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput control={form.control} name="date" type="date" label={t("common.date")} required />
                  <FormSelect control={form.control} name="treasuryId" numeric label={t("sales.treasury")} required
                    options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field><FieldLabel>{t("sales.customerName")}</FieldLabel><Input readOnly value={invoice.customerName ?? ""} className="h-10 bg-muted" /></Field>
                  <Field><FieldLabel>{t("sales.currentBalance")}</FieldLabel><Input readOnly value={formatMoney(customer?.balance ?? 0)} className="h-10 bg-muted text-center" /></Field>
                  <FormInput control={form.control} name="amount" type="number" label={t("sales.amount")} required />
                </div>
              </form>
              <Separator />
              <div className="font-semibold">{t("sales.previousPayments")}</div>
              {payments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("sales.noPayments")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {[t("sales.paymentNumber"), t("sales.paymentDate"), t("sales.treasury"), t("sales.amount"), ""].map((h, i) => <TableHead key={i} className="text-muted-foreground">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.paymentNumber}</TableCell>
                        <TableCell>{p.paymentDate ? formatDateTime(p.paymentDate, i18n.language) : "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.transactionName || "—"}</TableCell>
                        <TableCell className="font-semibold tabular-nums">{formatMoney(p.amount)}</TableCell>
                        <TableCell >
                          <Button variant="ghost" size="icon" aria-label={t("common.edit")} onClick={() => { setToEdit(p); editForm.reset({ amount: p.amount }) }}><Pencil /></Button>
                          <Button variant="ghost-destructive" size="icon" aria-label={t("common.delete")} onClick={() => setToDelete(p)}><Trash2 /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button type="submit" form="payment-form" disabled={record.isPending}>{t("sales.saveReceipt")}</Button>
        </DialogFooter>
      </DialogContent>
      <Dialog open={!!toEdit} onOpenChange={(o) => !o && setToEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("sales.editReceiptTitle")} {toEdit?.paymentNumber ?? ""}</DialogTitle></DialogHeader>
          <DialogBody>
            <form id="edit-payment-form" className="flex flex-col gap-3"
              onSubmit={editForm.handleSubmit((v) => toEdit && update.mutate({ paymentId: toEdit.id, amount: v.amount }, { onSuccess: () => setToEdit(null) }))}>
              <FormInput control={editForm.control} name="amount" type="number" label={t("sales.amount")} required />
            </form>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToEdit(null)}>{t("common.cancel")}</Button>
            <Button type="submit" form="edit-payment-form" disabled={update.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={t("sales.deleteReceiptTitle")}
        description={`${t("sales.receiptName")} ${toDelete?.paymentNumber ?? ""} — ${t("sales.deleteReceiptBody")}`} pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </Dialog>
  )
}
