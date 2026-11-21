import { useEffect, useRef, useState } from "react"
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { List, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { GlobalDiscountField } from "@/modules/sales/components/GlobalDiscountField"
import { FormInput, FormSelect } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { BalanceBox } from "@/components/BalanceBox"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { pickTreasury, useCustomers, useTreasuries, useWarehouses } from "@/modules/lookups/service"
import { LinesEditor } from "../components/LinesEditor"
import { PaymentFields } from "../components/PaymentFields"
import { TotalsPanel } from "../components/TotalsPanel"
import { useCreateInvoice } from "../queries"
import { invoiceSchema, today, type InvoiceForm } from "../schema"
import { invoiceTotals, paidOf } from "../totals"
import { useAutoPayment } from "../useAutoPayment"
import { useAppSettings } from "@/modules/settings"

export default function InvoiceFormPage() {
  const { t } = useTranslation()
  const appSettings = useAppSettings()
  const defaultCustomer = appSettings.customersTab?.defultCustomar
  const nav = useNavigate()
  const formBranch = useFormBranch()
  const { data: customers = [] } = useCustomers()
  const { data: warehouses = [] } = useWarehouses()
  const create = useCreateInvoice()
  const [addingCustomer, setAddingCustomer] = useState(false)
  const { data: treasuries = [] } = useTreasuries()
  const key = useRef(newIdempotencyKey())

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { date: today(), customerId: 0, warehouseId: 1, notes: "", globalDiscountKind: "value", globalDiscount: 0, lines: [], payments: [] },
  })
  const payments = useFieldArray({ control: form.control, name: "payments" })
  const [lines, gKind, gValue, pays, customerId] = useWatch({ control: form.control, name: ["lines", "globalDiscountKind", "globalDiscount", "payments", "customerId"] })
  const totals = invoiceTotals(lines, gKind, gValue)
  const [credit, setCredit] = useState(false)
  const paid = credit ? 0 : paidOf(pays.map((p) => ({ amount: p.amount || 0 })))
  const customer = customers.find((c) => c.id === customerId)
  useAutoPayment({ form, payments, pays, total: totals.grandTotal, treasuryId: pickTreasury(treasuries, appSettings.sales?.defaultSalesVault)?.id ?? 0, enabled: true })
  const overpaid = paid > totals.grandTotal + 0.005

  const defaulted = useRef(false)
  // The customers, warehouses and items belong to the branch, so what was picked from the old branch is cleared and the defaults are picked again.
  const changeBranch = async (next: number) => {
    await formBranch.pick(next)
    defaulted.current = false
    form.setValue("customerId", 0)
    form.setValue("warehouseId", 0)
    form.setValue("lines", [])
  }

  useEffect(() => {
    if (warehouses.length && !warehouses.some((w) => w.id === form.getValues("warehouseId"))) form.setValue("warehouseId", warehouses[0].id)
  }, [warehouses, form])

  useEffect(() => {
    if (defaulted.current || !customers.length) return
    defaulted.current = true
    const c = customers.find((x) => x.id === Number(defaultCustomer))
    if (c && !form.getValues("customerId")) form.setValue("customerId", c.id)
  }, [customers, defaultCustomer, form])

  const submit = form.handleSubmit((data) => {
    if (overpaid) return
    const input = credit ? { ...data, payments: data.payments.map((p) => ({ ...p, amount: 0 })) } : data
    create.mutate({ input, key: key.current }, {
      onSuccess: () => nav("/sales/invoices"),
      onError: renewIfReused(key),
    })
  })

  // "Credit" only disables the payment fields (the amounts stay as shown); on save the amounts go out as 0 so the invoice is on account.
  // A new payment splits the invoice total equally over all payments (the last one takes the cents left); the user edits freely after.
  const addPayment = () => {
    const n = pays.length + 1
    const cents = Math.round(totals.grandTotal * 100)
    const share = Math.floor(cents / n)
    pays.forEach((_, i) => form.setValue(`payments.${i}.amount`, share / 100, { shouldValidate: true, shouldDirty: true }))
    payments.append({ amount: (cents - share * (n - 1)) / 100, method: "Cash", treasuryId: pickTreasury(treasuries, appSettings.sales?.defaultSalesVault)?.id ?? 0, notes: "" })
  }

  // Date, party (and branch / warehouse when shown) in equal columns, notes taking the rest of the row.
  const topCols: Record<number, string> = { 2: "lg:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,2fr)]", 3: "lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,2fr)]", 4: "lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]" }
  // Laid out as in the current system: basic data, invoice details, payments beside the summary, then one box with the two buttons.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <PageHeader title={t("sales.newInvoice")}
          actions={<Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link to="/sales/invoices"><List />{t("sales.invoicesList")}</Link></Button>} />

        <SectionCard title={t("sales.basics")}>
          <div className={`grid grid-cols-1 items-start gap-6 sm:grid-cols-2 ${topCols[2 + (formBranch.show ? 1 : 0) + (warehouses.length > 1 ? 1 : 0)]}`}>
            {formBranch.show && <BranchSection plain value={formBranch.branchId} onChange={changeBranch} />}
            <Controller control={form.control} name="date" render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="date">{t("common.date")}<span className="text-destructive">*</span></FieldLabel>
                <Input id="date" type="date" {...field} />
              </Field>
            )} />
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <FormSelect control={form.control} name="customerId" numeric required searchable label={t("sales.customer")}
                  options={customers.map((c) => ({ value: String(c.id), label: c.customerName }))} />
                {appSettings.customersTab?.showActualBalance && customer && <BalanceBox label={t("sales.balanceLabel")} value={customer.balance ?? 0} debitWhenPositive />}
              </div>
              <Button type="button" variant="outline" size="icon-lg" className="mt-[27px] shrink-0" aria-label={t("customers.add")} title={t("customers.add")} onClick={() => setAddingCustomer(true)}><Plus /></Button>
            </div>
            {warehouses.length > 1 && <FormSelect control={form.control} name="warehouseId" numeric required label={t("sales.warehouse")} options={warehouses.map((w) => ({ value: String(w.id), label: w.warehouseName ?? "" }))} />}
            <div className="min-w-0 sm:col-span-2 lg:col-span-1"><FormInput control={form.control} name="notes" label={t("common.notes")} placeholder={t("sales.notesHint")} /></div>
          </div>
        </SectionCard>

        <SectionCard title={t("sales.invoiceDetails")}>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("sales.itemsList")}</h3>
          <LinesEditor hideDiscount />
        </SectionCard>

        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t("sales.payments")}</h2>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {totals.grandTotal > 0 && pays.length === 0 && <p className="text-sm text-muted-foreground">{t("sales.creditHint")}</p>}
              {payments.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                  {/* Amount and treasury side by side, each under a small grey caption. */}
                  <div className="w-full flex-1">
                    <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid"><span>{t("sales.amount")}</span><span>{t("sales.treasury")}</span></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><PaymentFields control={form.control} prefix={`payments.${i}`} compact disabled={credit} /></div>
                  </div>
                  <Button type="button" variant="ghost-destructive" size="icon" aria-label={t("common.remove")} disabled={credit} onClick={() => payments.remove(i)}><Trash2 /></Button>
                </div>
              ))}
              {overpaid && <p className="text-sm text-destructive">{t("sales.overpaid")}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" size="lg" variant="secondary" disabled={credit} onClick={addPayment} className="w-max rounded-lg px-4 text-sm font-medium transition-colors"><Plus size={16} strokeWidth={2} />{t("sales.addPayment")}</Button>
                {pays.length > 0 && <Button type="button" size="lg" variant={credit ? "destructive" : "secondary"} onClick={() => setCredit((v) => !v)} className="w-max rounded-lg px-4 text-sm font-medium transition-colors">{t(credit ? "sales.clearPayments" : "sales.deferred")}</Button>}
              </div>
            </div>

            <aside className="summary-box">
              <h3 className="mb-5 text-base font-semibold text-foreground">{t("sales.invoiceSummary")}</h3>
              <GlobalDiscountField />
              <TotalsPanel totals={totals} paid={paid} />
            </aside>
          </div>
        </section>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="destructive" size="xl"><Link to="/sales/invoices">{t("sales.cancelBack")}</Link></Button>
          <span className="text-sm text-destructive" role="status">
            {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}
          </span>
          <Button type="submit" size="xl" disabled={create.isPending || overpaid}>{t("sales.saveInvoice")}</Button>
        </div>
      </form>
      <CustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onCreated={(id) => form.setValue("customerId", id, { shouldValidate: true })} />
    </FormProvider>
  )
}
