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
import { useDeletePurchasePayment, usePurchase, useRecordPurchasePayment } from "../queries"
import type { PurchasePaymentDto } from "../types"

const paymentSchema = z.object({
  treasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
})
type PaymentForm = z.infer<typeof paymentSchema>

/** Pay a supplier against a purchase invoice (from the purchases list), with the payments already made; each can be deleted. */
export function PurchasePaymentsDialog({ purchaseId, onOpenChange }: { purchaseId: number | null; onOpenChange: (o: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const { data: purchase } = usePurchase(purchaseId ?? undefined)
  const record = useRecordPurchasePayment()
  const remove = useDeletePurchasePayment()
  const [toDelete, setToDelete] = useState<PurchasePaymentDto | null>(null)
  const defaultVault = useAppSettings().sales?.defaultPurchasesVault
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues: { treasuryId: 0, amount: 0 } })
  const payments = purchase?.payments ?? []
  const remaining = purchase?.remainingAmount ?? 0

  // Opening (or switching purchase) sets the treasury and proposes the remaining amount; a later refetch must not wipe what is typed.
  const loaded = purchase?.id === purchaseId
  useEffect(() => {
    if (purchaseId && loaded) form.reset({ treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, amount: remaining > 0 ? remaining : 0 })
  }, [purchaseId, loaded, treasuries, defaultVault]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = form.handleSubmit((v) => purchase && record.mutate(
    { id: purchase.id, treasuryId: v.treasuryId, amount: v.amount, notes: t("purchases.paymentNote", { number: purchase.purchaseOrderNumber, lng: "ar" }) },
    { onSuccess: () => onOpenChange(false) },
  ))

  return (
    <Dialog open={!!purchaseId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{t("purchases.paymentsTitle")} {purchase?.purchaseOrderNumber ?? ""}</DialogTitle></DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {purchase && (
            <>
              <form id="purchase-payment-form" onSubmit={submit} className="flex flex-col gap-3">
                <FormSelect control={form.control} name="treasuryId" numeric label={t("sales.treasury")} required
                  options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field><FieldLabel>{t("purchases.supplier")}</FieldLabel><Input readOnly value={purchase.supplierName ?? ""} className="h-10 bg-muted" /></Field>
                  <Field><FieldLabel>{t("purchases.remaining")}</FieldLabel><Input readOnly value={formatMoney(remaining)} className="h-10 bg-muted text-center" /></Field>
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
          <Button type="submit" form="purchase-payment-form" disabled={record.isPending || !purchase}>{t("purchases.addPayment")}</Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={t("purchases.deletePayment")}
        description={`${t("purchases.paymentName")} ${toDelete?.paymentNumber ?? ""} — ${t("sales.deleteReceiptBody")}`} pending={remove.isPending}
        onConfirm={() => toDelete?.id != null && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
    </Dialog>
  )
}
