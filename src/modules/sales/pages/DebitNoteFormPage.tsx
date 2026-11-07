import { PageBox } from "@/components/PageBox"
import { useEffect, useRef } from "react"
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormSelect, FormTextarea } from "@/components/form/FormFields"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useAppSettings } from "@/modules/settings"
import { pickTreasury, useTreasuries } from "@/modules/lookups/service"
import { LinesEditor } from "../components/LinesEditor"
import { PaymentFields } from "../components/PaymentFields"
import { TotalsPanel } from "../components/TotalsPanel"
import { useCreateDebitNote, useInvoice, useInvoices } from "../queries"
import { debitNoteSchema, today, type DebitNoteForm } from "../schema"
import { editorLineOf, invoiceTotals, paidOf } from "../totals"
import { useAutoPayment } from "../useAutoPayment"

const box = "rounded-sm border border-border bg-background p-6"

/**
 * Add a debit note, as in the current system: it is opened from an invoice, so the invoice number, customer and date
 * are shown locked, the notes follow, the items start as the invoice's (price and quantity can change), then the
 * payments beside the summary, and the box with the two buttons.
 */
export default function DebitNoteFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const invoiceId = Number(params.get("invoice")) || 0
  const { data: invoices = [] } = useInvoices()
  const { data: inv } = useInvoice(invoiceId || undefined)
  const { data: treasuries = [] } = useTreasuries()
  const vault = useAppSettings().sales?.defaultSalesVault
  const create = useCreateDebitNote()
  // One key for this note, so a double click or a retry saves it once.
  const key = useRef(newIdempotencyKey())
  const form = useForm<DebitNoteForm>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: { invoiceId, date: today(), reason: "", lines: [], payments: [] },
  })
  const payments = useFieldArray({ control: form.control, name: "payments" })
  const [lines, pays] = useWatch({ control: form.control, name: ["lines", "payments"] })
  const totals = invoiceTotals(lines, "value", 0)
  const paid = paidOf(pays.map((p) => ({ amount: p.amount || 0 })))
  const remaining = Math.max(0, Math.round((totals.grandTotal - paid) * 100) / 100)
  const overpaid = paid > totals.grandTotal + 0.005
  useAutoPayment({ form, payments, pays, total: totals.grandTotal, treasuryId: pickTreasury(treasuries, vault)?.id ?? 0, enabled: true })

  // The items start as the invoice's.
  useEffect(() => {
    if (inv && form.getValues("lines").length === 0) form.setValue("lines", (inv.items ?? []).map(editorLineOf))
  }, [inv, form])
  useEffect(() => { form.setValue("invoiceId", invoiceId) }, [invoiceId, form])

  const submit = form.handleSubmit((d) => !overpaid && create.mutate({ ...d, key: key.current }, { onSuccess: () => nav("/sales/debit-notes"), onError: renewIfReused(key) }))
  const addPayment = () => payments.append({ amount: remaining, method: "Cash", treasuryId: pickTreasury(treasuries, vault)?.id ?? 0, notes: "" })
  const locked = "cursor-not-allowed bg-muted/50 font-semibold"

  return (
    <FormProvider {...form}>
      <PageBox onSubmit={submit} title={t("oldDebit.title")}
        action={<Button asChild variant="outline"><Link to="/sales/debit-notes">{t("oldDebit.back")}<ArrowLeft size={16} /></Link></Button>}>

        <div className="space-y-6">
          <div className={box}>
            <h2 className="mb-6 text-lg font-bold text-foreground">{t("oldDebit.basic")}</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {invoiceId ? (
                <Field><FieldLabel>{t("oldDebit.invoiceNumber")}</FieldLabel><Input readOnly className={locked} value={inv?.orderNumber ?? ""} /></Field>
              ) : (
                <FormSelect control={form.control} name="invoiceId" numeric required label={t("oldDebit.invoiceNumber")} placeholder={t("sales.pickInvoice")}
                  options={invoices.map((i) => ({ value: String(i.id), label: `${i.orderNumber} · ${i.customerName}` }))} />
              )}
              <Field><FieldLabel>{t("oldDebit.customer")}</FieldLabel><Input readOnly className={locked} value={inv?.customerName ?? ""} /></Field>
              <Controller control={form.control} name="date" render={({ field }) => (
                <Field><FieldLabel>{t("oldDebit.date")}</FieldLabel><Input readOnly className={locked} value={new Date(field.value).toLocaleDateString("en-GB")} /></Field>
              )} />
            </div>
            <div className="mt-6"><FormTextarea control={form.control} name="reason" label={t("oldDebit.notes")} placeholder={t("oldDebit.notesHint")} className="[&_textarea]:min-h-[100px]" /></div>
          </div>

          <div className={box}><LinesEditor simple /></div>

          <div className="rounded-xl border border-border bg-background p-6">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
              <div className="inner-box lg:col-span-2">
                <h2 className="mb-6 text-xl font-bold text-foreground">{t("oldDebit.payments")}</h2>
                <div className="space-y-4">
                  {payments.fields.map((f, i) => (
                    <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                      <div className="w-full flex-1">
                        <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid"><span>{t("sales.amount")}</span><span>{t("oldDebit.paymentMethod")}</span></div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><PaymentFields control={form.control} prefix={`payments.${i}`} compact /></div>
                      </div>
                      <button type="button" onClick={() => payments.remove(i)} aria-label={t("common.remove")} className="rounded-md border border-transparent p-2 text-red-500 transition-colors hover:border-red-100 hover:bg-red-50"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  {overpaid && <p className="text-sm text-destructive">{t("sales.overpaid")}</p>}
                  <Button type="button" size="lg" variant="secondary" onClick={addPayment} disabled={remaining <= 0} className="w-max rounded-lg px-4 text-sm font-medium transition-colors"><Plus size={16} strokeWidth={2} />{t("oldDebit.addPayment")}</Button>
                </div>
              </div>
              <aside className="summary-box">
                <h3 className="mb-5 text-base font-semibold text-foreground">{t("oldDebit.summary")}</h3>
                <TotalsPanel totals={totals} paid={paid} />
              </aside>
            </div>
          </div>

          <div className="form-footer flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
            <Button type="button" variant="destructive" size="xl" onClick={() => nav("/sales/debit-notes")}>{t("oldDebit.cancel")}</Button>
            <Button type="submit" size="xl" disabled={create.isPending || overpaid}>{t("oldDebit.save")}</Button>
          </div>
        </div>
      </PageBox>
    </FormProvider>
  )
}
