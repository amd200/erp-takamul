import { useEffect, useRef, useState } from "react"
import { fullName } from "@/modules/lookups/types"
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router-dom"
import { List, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { QuickCustomerDialog } from "@/modules/pos/components/QuickCustomerDialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney } from "@/lib/format"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { pickTreasury, useCustomers, useEmployees, useTreasuries, useWarehouses } from "@/modules/lookups/service"
import { LinesEditor } from "../components/LinesEditor"
import { PaymentFields } from "../components/PaymentFields"
import { TotalsPanel } from "../components/TotalsPanel"
import { useCreateInvoice } from "../queries"
import { invoiceSchema, today, type InvoiceForm } from "../schema"
import { invoiceTotals, paidOf } from "../totals"
import { useAutoPayment } from "../useAutoPayment"
import { useAppSettings } from "@/modules/settings"
import { useClassic } from "@/shared/theme/ThemeProvider"

export default function InvoiceFormPage() {
  const { t } = useTranslation()
  const classic = useClassic()
  const appSettings = useAppSettings()
  const defaultCustomer = appSettings.customersTab?.defultCustomar
  const defaultEmployee = appSettings.salonsTab?.defaultServiceEmployeeId
  const nav = useNavigate()
  const { data: customers = [] } = useCustomers()
  const { data: warehouses = [] } = useWarehouses()
  const { data: employees = [] } = useEmployees()
  const create = useCreateInvoice()
  const [addingCustomer, setAddingCustomer] = useState(false)
  const { data: treasuries = [] } = useTreasuries()
  const key = useRef(newIdempotencyKey())

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { date: today(), customerId: 0, warehouseId: 1, employeeId: null, notes: "", globalDiscountKind: "value", globalDiscount: 0, lines: [], payments: [] },
  })
  const payments = useFieldArray({ control: form.control, name: "payments" })
  const [lines, gKind, gValue, pays, customerId] = useWatch({ control: form.control, name: ["lines", "globalDiscountKind", "globalDiscount", "payments", "customerId"] })
  const totals = invoiceTotals(lines, gKind, gValue)
  const paid = paidOf(pays.map((p) => ({ amount: p.amount || 0 })))
  const remaining = Math.max(0, Math.round((totals.grandTotal - paid) * 100) / 100)
  const customer = customers.find((c) => c.id === customerId)
  useAutoPayment({ form, payments, pays, total: totals.grandTotal, treasuryId: pickTreasury(treasuries, appSettings.sales?.defaultSalesVault)?.id ?? 0, enabled: true })
  const overpaid = paid > totals.grandTotal + 0.005

  const defaulted = useRef(false)
  useEffect(() => {
    if (defaulted.current || !customers.length) return
    defaulted.current = true
    const c = customers.find((x) => x.id === Number(defaultCustomer))
    if (c && !form.getValues("customerId")) form.setValue("customerId", c.id)
  }, [customers, defaultCustomer, form])

  const employeeDefaulted = useRef(false)
  useEffect(() => {
    if (employeeDefaulted.current || !appSettings.salonsTab?.showEmployeeService || !employees.length) return
    employeeDefaulted.current = true
    const e = employees.find((x) => x.id === Number(defaultEmployee))
    if (e && form.getValues("employeeId") == null) form.setValue("employeeId", e.id)
  }, [employees, defaultEmployee, appSettings.salonsTab?.showEmployeeService, form])

  const submit = form.handleSubmit((data) => {
    if (overpaid) return
    create.mutate({ input: data, key: key.current }, {
      onSuccess: () => nav("/sales/invoices"),
      onError: renewIfReused(key),
    })
  })

  const addPayment = () => payments.append({ amount: remaining, method: "Cash", treasuryId: pickTreasury(treasuries, appSettings.sales?.defaultSalesVault)?.id ?? 0, notes: "" })

  if (!classic) {
    const balance = appSettings.customersTab?.showActualBalance && customer && (customer.balance ?? 0) !== 0
      ? t("sales.customerBalance", { amount: formatMoney(Math.abs(customer.balance ?? 0)), side: t((customer.balance ?? 0) > 0 ? "sales.debtor" : "sales.creditor") })
      : undefined
    return (
      <FormProvider {...form}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <PageHeader crumbs={[t("nav.sales"), t("nav.invoicesA4")]} title={t("sales.newInvoice")} />

          <SectionCard title={t("sales.basics")}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <FormSelect control={form.control} name="customerId" numeric required label={t("sales.customer")}
                      options={customers.map((c) => ({ value: String(c.id), label: c.customerName }))} />
                  </div>
                  <Button type="button" variant="outline" size="icon-lg" aria-label={t("customers.add")} title={t("customers.add")} onClick={() => setAddingCustomer(true)}><Plus /></Button>
                </div>
                {balance && <p className="mt-1.5 text-sm text-muted-foreground">{balance}</p>}
              </div>
              <Controller control={form.control} name="date" render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="date">{t("common.date")}<span className="text-destructive">*</span></FieldLabel>
                  <Input id="date" type="date" className="h-10" {...field} />
                </Field>
              )} />
              {warehouses.length > 1 && <FormSelect control={form.control} name="warehouseId" numeric required label={t("sales.warehouse")} options={warehouses.map((w) => ({ value: String(w.id), label: w.warehouseName ?? "" }))} />}
              {appSettings.salonsTab?.showEmployeeService && <FormSelect control={form.control} name="employeeId" numeric label={t("sales.employee")} allowEmpty={t("common.none")} options={employees.map((e) => ({ value: String(e.id), label: fullName(e) }))} />}
            </div>
          </SectionCard>

          <SectionCard title={t("sales.lines")}><LinesEditor hideDiscount /></SectionCard>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex min-w-0 flex-col gap-5">
              <SectionCard title={t("sales.payments")} description={totals.grandTotal > 0 && pays.length === 0 ? t("sales.creditHint") : undefined}
                action={<Button type="button" variant="outline" disabled={remaining <= 0} onClick={addPayment}><Plus />{t("sales.addPayment")}</Button>}>
                {payments.fields.length === 0 ? (
                  <p className="text-muted-foreground">{t("sales.noPayments")}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[1fr_1.3fr_auto] gap-2 text-xs font-medium text-muted-foreground">
                      <span>{t("sales.amount")}</span><span>{t("sales.treasury")}</span><span className="w-9" />
                    </div>
                    {payments.fields.map((f, i) => (
                      <div key={f.id} className="grid grid-cols-[1fr_1.3fr_auto] items-start gap-2">
                        <PaymentFields control={form.control} prefix={`payments.${i}`} compact />
                        <Button type="button" variant="ghost" size="icon-lg" aria-label={t("common.remove")} onClick={() => payments.remove(i)} className="hover:bg-destructive-soft hover:text-destructive"><Trash2 /></Button>
                      </div>
                    ))}
                    {overpaid && <p className="text-sm text-destructive">{t("sales.overpaid")}</p>}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={t("common.notes")}>
                <FormTextarea control={form.control} name="notes" label={t("common.notes")} placeholder={t("sales.notesHint")} />
              </SectionCard>
            </div>

            <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
              <SectionCard title={t("sales.summary")}>
                <div className="mb-4 flex items-end gap-2">
                  <FormInput control={form.control} name="globalDiscount" type="number" label={t("sales.invoiceDiscount")} className="flex-1" />
                  <Controller control={form.control} name="globalDiscountKind" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-20" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                    </Select>
                  )} />
                </div>
                <TotalsPanel totals={totals} paid={paid} />
              </SectionCard>
            </aside>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
            <span className="text-sm text-destructive" role="status">
              {form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}
            </span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="lg"><Link to="/sales/invoices">{t("common.cancel")}</Link></Button>
              <Button type="submit" size="lg" disabled={create.isPending || overpaid}>{t("sales.saveInvoice")}</Button>
            </div>
          </div>
        </form>
        <QuickCustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onCreated={(id) => form.setValue("customerId", id, { shouldValidate: true })} />
      </FormProvider>
    )
  }

  // Laid out as in the current system: basic data, invoice details, payments beside the summary, then one box with the two buttons.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <PageHeader crumbs={[t("nav.sales"), t("nav.invoicesA4")]} title={t("sales.newInvoice")}
          actions={<Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link to="/sales/invoices"><List />{t("sales.invoicesList")}</Link></Button>} />

        <SectionCard title={t("sales.basics")}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Controller control={form.control} name="date" render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="date">{t("common.date")}<span className="text-destructive">*</span></FieldLabel>
                <Input id="date" type="date" {...field} />
              </Field>
            )} />
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <FormSelect control={form.control} name="customerId" numeric required label={t("sales.customer")}
                  options={customers.map((c) => ({ value: String(c.id), label: c.customerName }))} />
              </div>
              <Button type="button" variant="outline" size="icon-lg" className="mt-[27px] shrink-0" aria-label={t("customers.add")} title={t("customers.add")} onClick={() => setAddingCustomer(true)}><Plus /></Button>
            </div>
            {appSettings.customersTab?.showActualBalance && (
              <Field>
                <FieldLabel htmlFor="customerBalance">{t("sales.balanceLabel")}</FieldLabel>
                <Input id="customerBalance" readOnly tabIndex={-1} dir="ltr" className="bg-muted/50 font-semibold" value={customer ? `${formatMoney(Math.abs(customer.balance ?? 0))} ${(customer.balance ?? 0) === 0 ? "" : t((customer.balance ?? 0) > 0 ? "sales.debtor" : "sales.creditor")}`.trim() : "—"} />
              </Field>
            )}
            {appSettings.salonsTab?.showEmployeeService && <FormSelect control={form.control} name="employeeId" numeric label={t("sales.employee")} allowEmpty={t("common.none")} options={employees.map((e) => ({ value: String(e.id), label: fullName(e) }))} />}
            {warehouses.length > 1 && <FormSelect control={form.control} name="warehouseId" numeric required label={t("sales.warehouse")} options={warehouses.map((w) => ({ value: String(w.id), label: w.warehouseName ?? "" }))} />}
          </div>
          <div className="mt-6">
            <FormTextarea control={form.control} name="notes" label={t("common.notes")} placeholder={t("sales.notesHint")} />
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
              {payments.fields.length === 0 && !(totals.grandTotal > 0) && <p className="text-muted-foreground">{t("sales.noPayments")}</p>}
              {payments.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                  {/* Amount and treasury side by side, each under a small grey caption. */}
                  <div className="w-full flex-1">
                    <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid"><span>{t("sales.amount")}</span><span>{t("sales.treasury")}</span></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><PaymentFields control={form.control} prefix={`payments.${i}`} compact /></div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={t("common.remove")} onClick={() => payments.remove(i)} className="text-red-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"><Trash2 /></Button>
                </div>
              ))}
              {overpaid && <p className="text-sm text-destructive">{t("sales.overpaid")}</p>}
              <Button type="button" size="lg" variant="secondary" disabled={remaining <= 0} onClick={addPayment} className="w-max rounded-lg px-4 text-sm font-medium transition-colors"><Plus size={16} strokeWidth={2} />{t("sales.addPayment")}</Button>
            </div>

            <aside className="summary-box">
              <h3 className="mb-5 text-base font-semibold text-foreground">{t("sales.invoiceSummary")}</h3>
              <div className="mb-4 flex items-end gap-2">
                <FormInput control={form.control} name="globalDiscount" type="number" label={t("sales.invoiceDiscount")} className="flex-1" />
                <Controller control={form.control} name="globalDiscountKind" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 w-20" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                  </Select>
                )} />
              </div>
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
      <QuickCustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onCreated={(id) => form.setValue("customerId", id, { shouldValidate: true })} />
    </FormProvider>
  )
}
