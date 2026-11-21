import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"
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
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { z } from "zod"
import { useDeleteRefund, useRecordRefund, useReturn } from "../queries"
import type { PaymentDto } from "../types"

const paymentSchema = z.object({
  treasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
})
type PaymentForm = z.infer<typeof paymentSchema>

/** Refund a customer against a sales return (from the returns list), with the refunds already paid; each can be deleted. */
export function ReturnRefundsDialog({ returnId, onOpenChange }: { returnId: number | null; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const { data: ret } = useReturn(returnId ?? undefined)
  const record = useRecordRefund()
  const remove = useDeleteRefund()
  const [toDelete, setToDelete] = useState<PaymentDto | null>(null)
  const defaultVault = useAppSettings().sales?.defaultSalesVault
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues: { treasuryId: 0, amount: 0 } })
  const payments = ret?.payments ?? []
  const remaining = Math.max((ret?.grandTotal ?? 0) - (ret?.refundedAmount ?? 0), 0)

  // Opening (or switching purchase) sets the treasury and proposes the remaining amount; a later refetch must not wipe what is typed.
  const loaded = ret?.id === returnId
  useEffect(() => {
    if (returnId && loaded) form.reset({ treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, amount: remaining > 0 ? remaining : 0 })
  }, [returnId, loaded, treasuries, defaultVault]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = form.handleSubmit((v) => ret && record.mutate(
    { id: ret.id, treasuryId: v.treasuryId, amount: v.amount },
    { onSuccess: () => onOpenChange(false) },
  ))

  return (
    <Dialog open={!!returnId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t("sales.refundsTitle")} {ret?.returnNumber ?? ""}</DialogTitle></DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {ret && (
            <>
              <form id="return-refund-form" onSubmit={submit} className="flex flex-col gap-3">
                <FormSelect control={form.control} name="treasuryId" numeric label={t("sales.treasury")} required
                  options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field><FieldLabel>{t("sales.customerName")}</FieldLabel><Input readOnly value={ret.customerName ?? ""} className="h-10 bg-muted" /></Field>
                  <Field><FieldLabel>{t("viewDoc.remaining")}</FieldLabel><Input readOnly value={formatMoney(remaining)} className="h-10 bg-muted text-center" /></Field>
                  <FormInput control={form.control} name="amount" type="number" label={t("sales.amount")} required />
                </div>
              </form>
              <Separator />
              <div className="font-semibold">{t("sales.previousPayments")}</div>
              {payments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("sales.noRefunds")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {[t("sales.paymentNumber"), t("sales.paymentDate"), t("sales.treasury"), t("sales.amount"), ""].map((h, i) => <TableHead key={i} className="text-muted-foreground">{h}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, i) => (
                      <TableRow key={p.id ?? i}>
                        <TableCell className="font-medium">{p.paymentNumber || "—"}</TableCell>
                        <TableCell>{p.paymentDate ? formatDateTime(p.paymentDate, i18n.language) : "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.treasuryName || "—"}</TableCell>
                        <TableCell className="font-semibold tabular-nums">{formatMoney(p.amount)}</TableCell>
                        <TableCell>
                          {p.id != null && <Button variant="ghost-destructive" size="icon" aria-label={t("common.delete")} onClick={() => setToDelete(p)}><Trash2 /></Button>}
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
          <Button type="submit" form="return-refund-form" disabled={record.isPending || !ret}>{t("sales.addRefund")}</Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={t("sales.deleteRefundTitle")}
        description={`${t("sales.refundName")} ${toDelete?.paymentNumber ?? ""} — ${t("sales.deleteReceiptBody")}`} pending={remove.isPending}
        onConfirm={() => toDelete?.id != null && remove.mutate({ id: ret!.id, paymentId: toDelete.id }, { onSuccess: () => setToDelete(null) })} />
    </Dialog>
  )
}
