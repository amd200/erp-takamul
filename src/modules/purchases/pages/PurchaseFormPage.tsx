import { useEffect, useMemo, useRef } from "react"
import { purchaseLineOf, purchasePaymentsOf } from "../form"
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { List, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormSelect, FormTextarea } from "@/components/form/FormFields"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatMoney } from "@/lib/format"
import { useSupplierList } from "@/modules/suppliers/queries"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useAutoPayment } from "@/modules/sales/useAutoPayment"
import { pickTreasury, useSuppliers, useTreasuries, useWarehouses } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { LinesEditor } from "@/modules/sales/components/LinesEditor"
import { PaymentFields } from "@/modules/sales/components/PaymentFields"
import { TotalsPanel } from "@/modules/sales/components/TotalsPanel"
import { invoiceTotals, paidOf } from "@/modules/sales/totals"
import { useTaxes } from "@/modules/taxes/service"
import { usePurchase, useSavePurchase } from "../queries"
import { emptyPurchase, purchaseSchema, type PurchaseForm } from "../schema"

/** A purchase invoice: supplier, warehouse, the items with their cost, and what is paid now. Saving receives it into stock. */
export default function PurchaseFormPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : undefined
  const { data: existing, isLoading } = usePurchase(editId)
  const { data: suppliers = [] } = useSuppliers()
  const { data: supplierList = [] } = useSupplierList()
  const showBalance = useAppSettings().customersTab?.showActualBalance
  const { data: warehouses = [] } = useWarehouses()
  const { data: treasuries = [] } = useTreasuries()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const defaultVault =useAppSettings().sales?.defaultPurchasesVault
  const { data: taxes = [] } = useTaxes()
  const save = useSavePurchase()
  // One key per invoice being written, so a double click or a retry after a dropped connection saves it once.
  const key = useRef(newIdempotencyKey())

  const form = useForm<PurchaseForm>({ resolver: zodResolver(purchaseSchema), defaultValues: emptyPurchase() })
  const payments = useFieldArray({ control: form.control, name: "payments" })
  const [lines, pays, supplierId] = useWatch({ control: form.control, name: ["lines", "payments", "supplierId"] })
  const totals = useMemo(() => invoiceTotals(lines, "value", 0), [lines])
  const paid = paidOf(pays.map((p) => ({ amount: p.amount || 0 })))
  const remaining = Math.max(0, Math.round((totals.grandTotal - paid) * 100) / 100)
  const overpaid = paid > totals.grandTotal + 0.005
  // A new purchase starts with a payment for the whole total; editing a saved one keeps its payments as they are.
  useAutoPayment({ form, payments, pays, total: totals.grandTotal, treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, enabled: !editId })

  useEffect(() => {
    if (!existing || !taxes.length) return
    form.reset({
      supplierId: existing.supplierId ?? undefined, warehouseId: existing.warehouseId ?? undefined, date: (existing.orderDate ?? "").slice(0, 10), notes: existing.notes ?? "",
      lines: (existing.items ?? []).map(purchaseLineOf).map((l) => ({ ...l, taxRate: taxes.find((x) => x.id === l.taxId)?.amount ?? 0 })),
      payments: purchasePaymentsOf(existing).map((p) => ({ amount: p.amount, method: p.method, treasuryId: p.treasuryId, notes: p.notes })),
    })
  }, [existing, taxes, form])

  useEffect(() => { if (!editId && warehouses.length && !form.getValues("warehouseId")) form.setValue("warehouseId", warehouses[0].id) }, [editId, warehouses, form])

  useEffect(() => { if (!editId && suppliers.length && !form.getValues("supplierId")) form.setValue("supplierId", suppliers[0].id) }, [editId, suppliers, form])

  if (editId && isLoading) return <div className="h-96 animate-pulse rounded-xl bg-muted" />

  const submit = form.handleSubmit((data) => {
    if (overpaid) return
    // As in the current system: unless the branch is tax-exempt, every line needs a tax.
    if (!exempt) {
      const missing = data.lines.flatMap((l, i) => (l.taxId ? [] : [i]))
      if (missing.length) { missing.forEach((i) => form.setError(`lines.${i}.taxId`, { message: "pos3.taxRequired" })); return }
    }
    save.mutate({ id: editId, data, key: key.current }, { onSuccess: () => nav("/purchases"), onError: renewIfReused(key) })
  })

  const supplier = supplierList.find((x) => x.id === supplierId)
  const addPayment = () => payments.append({ amount: remaining, method: "Cash", treasuryId: pickTreasury(treasuries, defaultVault)?.id ?? 0, notes: "" })

  // Laid out as in the current system: basic data, invoice details, payments beside the summary, then one box with the two buttons.
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <PageHeader title={editId ? t("purchases.editTitle", { number: existing?.purchaseOrderNumber }) : t("purchases.formTitle")}
          actions={<Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link to="/purchases"><List />{t("purchases.backToPurchases")}</Link></Button>} />

        <SectionCard title={t("sales.basics")}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Controller control={form.control} name="date" render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="p-date">{t("common.date")}<span className="text-destructive">*</span></FieldLabel>
                <Input id="p-date" type="date" {...field} />
              </Field>
            )} />
            <FormSelect control={form.control} name="supplierId" numeric required label={t("purchases.supplier")} placeholder={t("reports.pick")}
              options={suppliers.map((s) => ({ value: String(s.id), label: s.supplierName }))} />
            {showBalance && (
              <Field>
                <FieldLabel htmlFor="supplierBalance">{t("purchases.supplierBalance")}</FieldLabel>
                <Input id="supplierBalance" readOnly tabIndex={-1} dir="ltr" className="bg-muted/50 font-semibold" value={supplier ? `${formatMoney(Math.abs(supplier.balance ?? 0))} ${(supplier.balance ?? 0) === 0 ? "" : t((supplier.balance ?? 0) < 0 ? "sales.debtor" : "sales.creditor")}`.trim() : "—"} />
              </Field>
            )}
            {warehouses.length > 1 && <FormSelect control={form.control} name="warehouseId" numeric required label={t("sales.warehouse")} options={warehouses.map((w) => ({ value: String(w.id), label: w.warehouseName ?? "" }))} />}
          </div>
          <div className="mt-6"><FormTextarea control={form.control} name="notes" label={t("common.notes")} placeholder={t("purchases.notesHint")} /></div>
        </SectionCard>

        <SectionCard title={t("sales.invoiceDetails")}>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("sales.itemsList")}</h3>
          <LinesEditor purchase simple />
        </SectionCard>

        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t("sales.payments")}</h2>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {totals.grandTotal > 0 && pays.length === 0 && <p className="text-sm text-muted-foreground">{t("purchases.creditHint")}</p>}
              {payments.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                  <div className="w-full flex-1">
                    <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid"><span>{t("sales.amount")}</span><span>{t("sales.treasury")}</span></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><PaymentFields control={form.control} prefix={`payments.${i}`} compact /></div>
                  </div>
                  <Button type="button" variant="ghost-destructive" size="icon" aria-label={t("common.remove")} onClick={() => payments.remove(i)}><Trash2 /></Button>
                </div>
              ))}
              {overpaid && <p className="text-sm text-destructive">{t("sales.overpaid")}</p>}
              <Button type="button" size="lg" variant="secondary" disabled={remaining <= 0} onClick={addPayment} className="w-max rounded-lg px-4 text-sm font-medium transition-colors"><Plus size={16} strokeWidth={2} />{t("sales.addPayment")}</Button>
            </div>
            <aside className="summary-box">
              <h3 className="mb-5 text-base font-semibold text-foreground">{t("sales.invoiceSummary")}</h3>
              <TotalsPanel totals={totals} paid={paid} />
            </aside>
          </div>
        </section>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="destructive" size="xl"><Link to="/purchases">{t("sales.cancelBack")}</Link></Button>
          <span className="text-sm text-destructive" role="status">{form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0 ? t("products.fixErrors") : ""}</span>
          <Button type="submit" size="xl" disabled={save.isPending || overpaid}>{editId ? t("common.saveChanges") : t("sales.saveInvoice")}</Button>
        </div>
      </form>
    </FormProvider>
  )
}
