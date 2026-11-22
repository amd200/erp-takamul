import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { formatMoney, formatDateTime } from "@/lib/format"
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"

const paymentSchema = z.object({
  treasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
  paymentDate: z.string().min(1, "validation.dateRequired"),
  notes: z.string().max(1000),
})
type PaymentForm = z.infer<typeof paymentSchema>

const today = () => new Date().toLocaleDateString("sv")

export type PaymentRow = { id?: number | null; paymentNumber?: string | null; paymentDate?: string | null; treasuryName?: string | null; amount: number }

type Props = {
  /** Whether the dialog is open (the owner decides from its id). */
  open: boolean
  /** Changes with the record shown; the treasury and the proposed amount are set again when it does (and the record has loaded). */
  resetKey: unknown
  /** False while the record is still loading. */
  ready: boolean
  onOpenChange: (o: boolean) => void
  title: string
  partyLabel: string
  partyName?: string | null
  /** The read-only figure beside the party (customer balance, remaining on a purchase). */
  figureLabel: string
  figure: number
  /** Treasury setting to pick by default (e.g. `defaultSalesVault`). */
  defaultVault?: number | null
  /** Show a notes field the user writes (sent as `v.notes`). */
  withNotes?: boolean
  /** Amount proposed when the dialog opens. */
  initialAmount?: number
  payments: PaymentRow[]
  texts: { submit: string; empty: string; deleteTitle: string; deleteName: string }
  recordPending: boolean
  deletePending: boolean
  /** Save one payment; call `done` once it went through (closes the dialog). */
  onSubmit: (v: PaymentForm, done: () => void) => void
  onDelete: (id: number, done: () => void) => void
}

/** Pay against one record (sales invoice, sales return, purchase) and list the payments already made; a payment can be deleted, not edited. */
export function PaymentsDialog({ open, resetKey, ready, onOpenChange, title, partyLabel, partyName, figureLabel, figure, defaultVault, withNotes, initialAmount = 0, payments, texts, recordPending, deletePending, onSubmit, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const { data: treasuries = [] } = useTreasuries()
  const [toDelete, setToDelete] = useState<PaymentRow | null>(null)
  const form = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues: { treasuryId: 0, amount: 0, paymentDate: today(), notes: "" } })

  // Opening (or switching record) sets the treasury and proposes the amount; a later refetch must not wipe what is typed.
  useEffect(() => {
    if (open && ready) form.reset({ treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, amount: initialAmount > 0 ? initialAmount : 0, paymentDate: today(), notes: "" })
  }, [open, ready, resetKey, treasuries, defaultVault]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = form.handleSubmit((v) => onSubmit(v, () => onOpenChange(false)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <DialogBody className="flex max-h-[70vh] flex-col gap-4 [&>*]:shrink-0">
          {ready && (
            <>
              <form id="payments-form" onSubmit={submit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                  <FormInput control={form.control} name="paymentDate" type="date" label={t("sales.paymentDate")} required />
                  <FormSelect control={form.control} name="treasuryId" numeric label={t("sales.treasury")} required
                    options={treasuries.map((x) => ({ value: String(x.id), label: x.name }))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field><FieldLabel>{partyLabel}</FieldLabel><Input readOnly value={partyName ?? ""} className="h-10 bg-muted" /></Field>
                  <Field><FieldLabel>{figureLabel}</FieldLabel><Input readOnly value={formatMoney(figure)} className="h-10 bg-muted text-center" /></Field>
                  <FormInput control={form.control} name="amount" type="number" label={t("sales.amount")} required />
                </div>
                {withNotes && <FormTextarea control={form.control} name="notes" label={t("common.notes")} className="[&_textarea]:h-10 [&_textarea]:min-h-10" />}
              </form>
              <Separator />
              <div className="font-semibold">{t("sales.previousPayments")}</div>
              {payments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{texts.empty}</div>
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
          <Button type="submit" form="payments-form" disabled={recordPending || !ready}>{texts.submit}</Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={texts.deleteTitle}
        description={`${texts.deleteName} ${toDelete?.paymentNumber ?? ""} — ${t("sales.deleteReceiptBody")}`} pending={deletePending}
        onConfirm={() => toDelete?.id != null && onDelete(toDelete.id, () => setToDelete(null))} />
    </Dialog>
  )
}
