import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useDeletePayment, useRecordPayment } from "../queries"
import { paymentFormSchema, type PaymentForm } from "../schema"
import { orderTotals } from "../totals"
import type { SalesOrderDto } from "../types"
import { PaymentFields } from "./PaymentFields"
import { TotalsPanel } from "./TotalsPanel"

/** Payments recorded against an invoice, and a form to collect the rest. */
export function PaymentsDialog({ invoice, onOpenChange }: { invoice: SalesOrderDto | null; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const record = useRecordPayment()
  const remove = useDeletePayment()
  const paid = invoice?.totalPaid ?? 0
  const remaining = invoice ? Math.max(0, Math.round(((invoice.grandTotal ?? 0) - paid) * 100) / 100) : 0
  const defaultVault = useAppSettings().sales?.defaultSalesVault
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentFormSchema), defaultValues: { amount: 0, method: "Cash", treasuryId: 0, notes: "" } })
  // One key per payment being typed: sending it twice (double click, retry) records it once.
  const key = useRef(newIdempotencyKey())

  useEffect(() => { if (invoice) form.reset({ amount: remaining, method: "Cash", treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, notes: "" }) }, [invoice, remaining, form, treasuries, defaultVault])

  const submit = form.handleSubmit((payment) => invoice && record.mutate({ invoiceId: invoice.id, payment, key: key.current }, { onSuccess: () => { key.current = newIdempotencyKey() }, onError: renewIfReused(key) }))

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("sales.paymentsTitle", { number: invoice?.orderNumber })}</DialogTitle>
          <DialogDescription>{invoice?.customerName}</DialogDescription>
        </DialogHeader>
        {invoice && (
          <>
            <TotalsPanel totals={orderTotals(invoice)} paid={paid} />
            {(invoice.payments ?? []).length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {[t("common.date"), t("sales.method"), t("sales.treasury"), t("sales.amount"), ""].map((h, i) => <TableHead key={i} className="text-xs text-muted-foreground">{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoice.payments ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.paymentDate ? formatDateTime(p.paymentDate, i18n.language) : "—"}</TableCell>
                      <TableCell>{t(`sales.methods.${p.paymentMethod}`)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.treasuryName}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatMoney(p.amount)}</TableCell>
                      <TableCell className="text-end">
                        <Can perm={P.sales.payments}>
                          <Button variant="ghost" size="icon" aria-label={t("common.delete")} disabled={remove.isPending}
                            onClick={() => remove.mutate(p.id)} className="hover:bg-destructive-soft hover:text-destructive"><Trash2 /></Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {remaining > 0 && (
              <Can perm={P.sales.payments}>
                <Separator />
                <form id="payment-form" onSubmit={submit} className="flex flex-col gap-3">
                  <div className="font-semibold">{t("sales.collect")}</div>
                  <div className="grid gap-3 sm:grid-cols-2"><PaymentFields control={form.control} /></div>
                </form>
              </Can>
            )}
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
          {remaining > 0 && <Can perm={P.sales.payments}><Button type="submit" form="payment-form" disabled={record.isPending}>{t("sales.recordPayment")}</Button></Can>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
