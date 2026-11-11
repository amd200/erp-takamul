import { useEffect, useMemo, useRef, useState } from "react"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { quoteGlobalDiscount, quoteLineOf } from "../form"
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput, FormSelect, FormTextarea } from "@/components/form/FormFields"
import { BalanceBox } from "@/components/BalanceBox"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { useCustomers } from "@/modules/lookups/service"
import { LinesEditor } from "@/modules/sales/components/LinesEditor"
import { invoiceTotals } from "@/modules/sales/totals"
import { TotalsPanel } from "@/modules/sales/components/TotalsPanel"
import { CustomerDialog } from "@/modules/customers/components/CustomerDialog"
import { BranchSection } from "@/modules/branches/BranchSection"
import { useFormBranch } from "@/modules/branches/useFormBranch"
import { useQuote, useSaveQuote } from "../queries"
import { useAppSettings } from "@/modules/settings"
import { emptyQuote, quoteSchema, type QuoteForm } from "../schema"

/** New or edited quotation: who it is for, the lines, and what it comes to with delivery. */
export default function QuoteFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : undefined
  const formBranch = useFormBranch(!editId)
  const { data: existing, isLoading } = useQuote(editId)
  const { data: customers = [] } = useCustomers()
  const [addingCustomer, setAddingCustomer] = useState(false)
  const save = useSaveQuote()
  // One key per new quotation: a double click or a retry saves it once.
  const key = useRef(newIdempotencyKey())
  const customersTab = useAppSettings().customersTab
  const defaultCustomer = customersTab?.defultCustomar
  const form = useForm<QuoteForm>({ resolver: zodResolver(quoteSchema), defaultValues: emptyQuote() })

  // A new quotation starts on the branch's default customer, once; editing keeps the saved one.
  const defaulted = useRef(false)
  useEffect(() => {
    if (editId || defaulted.current || !customers.length) return
    defaulted.current = true
    const c = customers.find((x) => x.id === Number(defaultCustomer))
    if (c && !form.getValues("customerId")) form.setValue("customerId", c.id)
  }, [editId, customers, defaultCustomer, form])

  // The customers and items belong to the branch, so what was picked from the old branch is cleared and the default customer is picked again.
  const changeBranch = async (next: number) => {
    await formBranch.pick(next)
    const empty = emptyQuote()
    defaulted.current = false
    form.setValue("customerId", empty.customerId)
    form.setValue("lines", empty.lines)
  }

  useEffect(() => {
    if (!existing) return
    form.reset({
      customerId: existing.customerid ?? undefined, date: (existing.quotationDate ?? "").slice(0, 10), notes: existing.notes ?? "",
      globalDiscountKind: "value", globalDiscount: quoteGlobalDiscount(existing), shipping: 0, lines: (existing.items ?? []).map(quoteLineOf),
    })
  }, [existing, form])

  const [lines, globalDiscountKind, globalDiscount] = useWatch({ control: form.control, name: ["lines", "globalDiscountKind", "globalDiscount"] })
  const customerId = useWatch({ control: form.control, name: "customerId" })
  const customer = customers.find((c) => c.id === customerId)
  const totals = useMemo(() => invoiceTotals(lines, globalDiscountKind, globalDiscount || 0), [lines, globalDiscountKind, globalDiscount])

  if (editId && isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />

  const submit = form.handleSubmit((data) => save.mutate({ id: editId, data, key: key.current }, { onSuccess: () => nav("/quotes"), onError: renewIfReused(key) }))

  // Laid out as in the current system: basic data, the lines, then one box with the two buttons; the summary sits at the end.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <PageHeader title={editId ? t("quotes.editTitle", { number: existing?.quotationNumber }) : t("quotes.newTitle")}
          actions={<Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link to="/quotes"><List />{t("quotes.backToList")}</Link></Button>} />

        <SectionCard title={t("sales.basics")}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formBranch.show && <BranchSection plain value={formBranch.branchId} onChange={changeBranch} />}
            <Controller control={form.control} name="date" render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="q-date">{t("common.date")}<span className="text-destructive">*</span></FieldLabel>
                <Input id="q-date" type="date" {...field} />
              </Field>
            )} />
            <div>
              <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
              <FormSelect control={form.control} name="customerId" numeric required label={t("sales.customer")} placeholder={t("reports.pick")}
                options={customers.map((c) => ({ value: String(c.id), label: c.customerName }))} />
              </div>
              <Button type="button" variant="outline" size="icon-lg" className="mt-[27px] shrink-0" aria-label={t("customers.add")} title={t("customers.add")} onClick={() => setAddingCustomer(true)}><Plus /></Button>
              </div>
              {customersTab?.showActualBalance && customer && <BalanceBox label={t("sales.balanceLabel")} value={customer.balance ?? 0} debitWhenPositive />}
            </div>
          </div>
          <div className="mt-6">
            <FormTextarea control={form.control} name="notes" label={t("common.notes")} placeholder={t("quotes.notesHint")} />
          </div>
        </SectionCard>

        <SectionCard title={t("sales.invoiceDetails")}>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("sales.itemsList")}</h3>
          <LinesEditor simple />
        </SectionCard>

        <section className="rounded-xl border border-border bg-background p-6">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="hidden lg:col-span-2 lg:block" />
            <aside className="summary-box">
              <h3 className="mb-5 text-base font-semibold text-foreground">{t("sales.invoiceSummary")}</h3>
              <div className="mb-4 flex items-end gap-2">
                <FormInput control={form.control} name="globalDiscount" type="number" label={t("sales.invoiceDiscount")} className="flex-1" />
                <Controller control={form.control} name="globalDiscountKind" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 w-20" aria-label={t("sales.discountKind")}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="value">{t("sales.kindValue")}</SelectItem><SelectItem value="percent">{t("sales.kindPercent")}</SelectItem></SelectContent>
                  </Select>
                )} />
              </div>
              <TotalsPanel totals={totals} />
            </aside>
          </div>
        </section>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="destructive" size="xl"><Link to="/quotes">{t("common.cancel")}</Link></Button>
          <span className="text-sm text-destructive" role="status">{form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}</span>
          <Button type="submit" size="xl" disabled={save.isPending}>{editId ? t("common.saveChanges") : t("quotes.saveIssue")}</Button>
        </div>
      </form>
      <CustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onCreated={(id) => form.setValue("customerId", id, { shouldValidate: true })} />
    </FormProvider>
  )
}
