import { PageBox } from "@/components/PageBox";
import { useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { PaymentFields } from "../components/PaymentFields";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency";
import { useAppSettings } from "@/modules/settings";
import { useTreasuries } from "@/modules/lookups/service";
import { useCreateReturn, useInvoice } from "../queries";
import { returnSchema, today, type ReturnForm } from "../schema";

const box = "inner-box";
const money = (n: number) => n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Return part or all of an invoice, as in the current system: it is opened from the invoice, so the date, employee and
 * customer are shown locked, the items start as the invoice's (only the quantity can change, never past what is left
 * after earlier returns), then the refund beside the summary, and the box with the two buttons.
 */
export default function ReturnFormPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const invoiceId = Number(params.get("invoice")) || undefined;
  const { data: inv } = useInvoice(invoiceId);
  const items = inv?.items ?? [];
  const { data: treasuries = [] } = useTreasuries();
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt";
  const showReturned = useAppSettings().generalTab?.showReturnedItemsDetails === true;
  const create = useCreateReturn();
  // One key for this return, so a double click or a retry saves it once.
  const key = useRef(newIdempotencyKey());

  const form = useForm<ReturnForm>({ resolver: zodResolver(returnSchema), defaultValues: { date: today(), reason: "", lines: [], payments: [{ treasuryId: 1, amount: 0 }] } });
  const payments = useFieldArray({ control: form.control, name: "payments" });
  const returned = useFieldArray({ control: form.control, name: "lines" });
  const rows = useWatch({ control: form.control, name: "lines" });

  // Each form row carries the invoice line's id; the line itself is found by it, never by position.
  const lineOf = (i: number) => items.find((l) => l.id === rows[i]?.originalItemId);
  // What the server says is left to return on each item.
  const leftOf = (i: number) => lineOf(i)?.remainingQuantity ?? 0;
  // The items start as the invoice's; the refund rows start as the invoice's own payments (every treasury it was paid into, with what each took).
  useEffect(() => {
    if (!inv) return;
    const paidRows = (inv.payments ?? []).map((p) => ({ treasuryId: p.treasuryId ?? 0, amount: p.amount }));
    form.reset({
      ...form.getValues(),
      lines: (inv.items ?? []).map((l) => ({
        originalItemId: l.id ?? 0,
        productId: l.productId,
        unitId: l.unitId ?? 0,
        productName: l.productName ?? "",
        unitName: l.unitName ?? "",
        quantity: l.remainingQuantity ?? 0,
        unitPrice: l.unitPrice ?? 0,
        taxPercentage: l.taxPercentage ?? 0,
        taxCalculation: l.taxCalculation === 1 ? (1 as const) : (2 as const),
        discountKind: l.discountPercentage ? ("percent" as const) : ("value" as const),
        discount: l.discountPercentage || (l.discountValue ?? 0) * l.quantity,
      })),
      payments: paidRows.length ? paidRows : [{ treasuryId: form.getValues("payments.0.treasuryId"), amount: 0 }],
    });
  }, [inv, form]);

  // A line's server total and tax are for its whole quantity, so the returned part is that share of them.
  const shareOf = (i: number, value: number | null | undefined) => ((value ?? 0) * (rows[i]?.quantity || 0)) / (lineOf(i)?.quantity || 1);
  const totals = rows.reduce((sum, _, i) => ({ grandTotal: sum.grandTotal + shareOf(i, lineOf(i)?.lineTotal), tax: sum.tax + shareOf(i, lineOf(i)?.taxAmount) }), { grandTotal: 0, tax: 0 });
  const paid = inv?.totalPaid ?? 0;
  const pays = useWatch({ control: form.control, name: "payments" });
  const refundAmount = pays.reduce((s, p) => s + (p.amount || 0), 0);
  const overLimit = rows.some((r, i) => (r.quantity || 0) > leftOf(i));
  const hasReturn = rows.some((r) => r.quantity > 0);

  // With one payment, suggest refunding what was actually paid for the returned goods.
  const suggested = Math.min(totals.grandTotal, paid);
  useEffect(() => {
    if (form.getValues("payments").length === 1) form.setValue("payments.0.amount", suggested);
  }, [suggested, form]);
  const addPayment = () => payments.append({ treasuryId: pays[0]?.treasuryId || treasuries[0]?.id || 0, amount: Math.max(0, Math.round((totals.grandTotal - refundAmount) * 100) / 100) });

  const submit = form.handleSubmit((d) => {
    if (!inv || overLimit || !hasReturn) return;
    create.mutate({ key: key.current, order: inv, date: d.date, reason: d.reason, lines: d.lines, refunds: d.payments }, { onSuccess: () => nav("/sales/returns"), onError: renewIfReused(key) });
  });

  if (!inv)
    return (
      <EmptyState
        icon={<Undo2 />}
        title={t("sales.notFound")}
        action={
          <Button asChild variant="outline">
            <Link to="/sales/returns">{t("viewDoc.backToReturns")}</Link>
          </Button>
        }
      />
    );

  const cols = exempt ? "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_0.9fr_60px]" : "md:grid-cols-[1.5fr_0.9fr_1fr_0.7fr_1fr_0.9fr_0.9fr_60px]";
  const head = [t("sales.productCol"), t("products.unit"), t("sales.unitPrice"), t("products.quantity"), ...(exempt ? [] : [t("sales.beforeTax"), t("sales.vat")]), t("sales.lineTotal"), ""];
  const locked = "cursor-not-allowed";

  return (
    <PageBox
      onSubmit={submit}
      title={t("viewDoc.returnInvoice")}
      action={
        <Button asChild variant="outline">
          <Link to="/sales/returns">
            {t("viewDoc.backToReturns")}
            <ArrowLeft size={16} />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("sales.basics")}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Field>
              <FieldLabel>{t("common.date")} *</FieldLabel>
              <Input disabled className={locked} value={form.watch("date")} />
            </Field>
            <Field>
              <FieldLabel>{t("oldReturn.serviceEmployee")}</FieldLabel>
              <Input disabled className={locked} value={inv.employeeName ?? ""} placeholder={t("oldReturn.chooseServiceEmployee")} />
            </Field>
            <Field>
              <FieldLabel>{t("sales.customer")} *</FieldLabel>
              <Input disabled className={locked} value={inv.customerName ?? ""} />
            </Field>
            <Field>
              <FieldLabel>{t("oldReturn.discountValue")}</FieldLabel>
              <Input disabled className={cn("text-center", locked)} value={0} />
            </Field>
            <div className="lg:col-span-4">
              <Controller
                control={form.control}
                name="reason"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{t("oldDebit.notes")}</FieldLabel>
                    <Textarea {...field} placeholder={t("oldDebit.notesHint")} />
                    {fieldState.error && <p className="text-xs text-destructive">{t(fieldState.error.message ?? "")}</p>}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("sales.invoiceDetails")}</h2>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("sales.itemsList")}</h3>
          <div className="w-full overflow-x-auto pb-4">
            <div className={cn("hidden items-center gap-3 border-b border-border px-2 pb-3 text-center text-xs font-medium tracking-widest text-muted-foreground uppercase md:grid md:min-w-[900px]", cols)}>
              {head.map((h, i) => (
                <div key={i} className={i === 0 ? "text-start" : ""}>
                  {h}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              {returned.fields.map((f, i) => {
                const l = lineOf(i);
                if (!l) return null;
                const left = leftOf(i);
                const over = (rows[i]?.quantity || 0) > left;
                const total = shareOf(i, l.lineTotal);
                const tax = shareOf(i, l.taxAmount);
                return (
                  <div key={f.id} className={cn("grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 md:min-w-[900px] md:rounded-none md:border-none md:bg-transparent md:p-2", cols)}>
                    <div className="font-semibold">{rows[i]?.productName}</div>
                    <span className="block rounded-md bg-muted px-3 py-2.5 text-center">{rows[i]?.unitName || "-"}</span>
                    <Input disabled className={cn("text-center", locked)} value={(rows[i]?.unitPrice ?? 0).toFixed(2)} />
                    <div>
                      <Controller control={form.control} name={`lines.${i}.quantity`} render={({ field }) => <Input type="number" min={0} step="any" className="text-center" value={field.value ?? ""} onBlur={field.onBlur} onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} />} />
                      {over && <span className="text-xs text-destructive">{t("sales.overReturn", { max: left })}</span>}
                    </div>
                    {!exempt && <div className="text-center font-medium">{money(total - tax)}</div>}
                    {!exempt && <div className="text-center font-medium text-orange-500">{money(tax)}</div>}
                    <div className="text-center font-bold text-success">{money(total)}</div>
                    <div className="flex justify-center">
                      <button type="button" disabled aria-label={t("common.remove")} className="p-2 text-muted-foreground disabled:opacity-30">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {showReturned && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground md:col-span-full">
                        <span className="rounded-md bg-muted px-2.5 py-1.5">
                          {t("oldReturn.returnedQty")}: <span className="font-medium text-red-500 tabular-nums">{l.returnedQuantity ?? 0}</span>
                        </span>
                        <span className="rounded-md bg-muted px-2.5 py-1.5">
                          {t("oldReturn.remainingQty")}: <span className="font-medium text-red-500 tabular-nums">{left}</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className={cn(box, "rounded-xl lg:col-span-2")}>
            <h2 className="mb-6 text-xl font-bold text-foreground">{t("sales.payments")}</h2>
            <div className="space-y-4">
              {payments.fields.map((f, i) => (
                <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                  {/* Same row as the A4 invoice: amount and treasury side by side under small grey captions. */}
                  <div className="w-full flex-1">
                    <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid">
                      <span>{t("sales.amount")}</span>
                      <span>{t("sales.treasury")}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <PaymentFields control={form.control} prefix={`payments.${i}`} compact />
                    </div>
                  </div>
                  <Button type="button" variant="ghost-destructive" size="icon" aria-label={t("common.remove")} disabled={payments.fields.length === 1} onClick={() => payments.remove(i)}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" size="lg" variant="secondary" onClick={addPayment} className="w-max rounded-lg px-4 text-sm font-medium transition-colors">
                <Plus size={16} strokeWidth={2} />
                {t("sales.addPayment")}
              </Button>
            </div>
          </div>

          <div className={cn(box, "rounded-xl")}>
            <h3 className="mb-4 text-sm font-bold">{t("oldDebit.summary")}</h3>
            <div className="space-y-3 text-sm">
              {!exempt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("sales.beforeTax")}</span>
                    <span className="font-semibold tabular-nums">{money(totals.grandTotal - totals.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("sales.vat")}</span>
                    <span className="font-semibold tabular-nums text-amber-600">{money(totals.tax)}</span>
                  </div>
                </>
              )}
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <span className="font-bold">{t("viewDoc.grandTotal")}</span>
                <span className="text-2xl font-black tabular-nums text-primary">{money(totals.grandTotal)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("viewDoc.paid")}</span>
                <span className="font-semibold tabular-nums text-success">{money(refundAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("viewDoc.remaining")}</span>
                <span className="font-semibold tabular-nums text-red-500">{money(totals.grandTotal - refundAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <Button type="button" variant="destructive" size="xl" onClick={() => nav("/sales/returns")}>
            {t("oldDebit.cancel")}
          </Button>
          <Button type="submit" size="xl" disabled={overLimit || !hasReturn || create.isPending}>
            {t("oldReturn.save")}
          </Button>
        </div>
      </div>
    </PageBox>
  );
}
