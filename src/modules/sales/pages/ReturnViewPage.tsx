import { PageBox } from "@/components/PageBox"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, FileText, Printer, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { EmptyState } from "@/components/EmptyState"
import { formatMoney } from "@/lib/format"
import { useAppSettings } from "@/modules/settings"
import { useReturn } from "../queries"
import { usePrintReturn } from "../print/usePrintReturn"

const box = "inner-box"

/** A saved return, shown as in the current system: the return form itself, with every field locked. */
export default function ReturnViewPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data: r, isLoading } = useReturn(Number(id))
  const print = usePrintReturn()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted" />
  if (!r) return <EmptyState icon={<Undo2 />} title={t("sales.notFound")} action={<Button asChild variant="outline"><Link to="/sales/returns">{t("viewDoc.backToReturns")}</Link></Button>} />

  const cols = exempt ? "md:grid-cols-[2fr_1fr_1fr_1fr_1fr]" : "md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr]"
  const money = (n: number) => n.toLocaleString("en-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const head = [t("sales.productCol"), t("products.unit"), t("sales.unitPrice"), t("products.quantity"), ...(exempt ? [] : [t("sales.beforeTax"), t("sales.vat")]), t("sales.lineTotal")]

  return (
    <PageBox title={t("viewDoc.returnInvoice")}
      action={<div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={print.isPending} onClick={() => print.mutate({ ret: r, paper: "a4" })}><FileText size={16} />{t("sales.actions.printA4")}</Button>
        <Button variant="outline" disabled={print.isPending} onClick={() => print.mutate({ ret: r, paper: "roll" })}><Printer size={16} />{t("sales.actions.printRoll")}</Button>
        <Button asChild variant="outline"><Link to="/sales/returns">{t("viewDoc.backToReturns")}<ArrowLeft size={16} /></Link></Button>
      </div>}>

      <div className="space-y-6">
        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("sales.basics")}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Field><FieldLabel>{t("common.date")} *</FieldLabel><Input disabled value={r.returnDate?.slice(0, 10) ?? ""} /></Field>
            <Field><FieldLabel>{t("sales.invoice")}</FieldLabel><Input disabled value={r.salesOrderNumber ?? ""} /></Field>
            <Field><FieldLabel>{t("sales.customer")} *</FieldLabel><Input disabled value={r.customerName ?? ""} /></Field>
            <Field><FieldLabel>{t("sales.returnNumber")}</FieldLabel><Input disabled value={r.returnNumber ?? ""} /></Field>
            <div className="lg:col-span-4"><Field><FieldLabel>{t("sales.reason")}</FieldLabel><Textarea disabled value={r.reason ?? ""} /></Field></div>
          </div>
        </div>

        <div className={box}>
          <h2 className="mb-6 text-lg font-bold text-foreground">{t("sales.invoiceDetails")}</h2>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{t("sales.itemsList")}</h3>
          <div className="w-full overflow-x-auto pb-4">
            <div className={`hidden items-center border-b border-border px-2 pb-3 text-center text-xs font-medium tracking-widest text-muted-foreground uppercase md:grid ${cols}`}>
              {head.map((h, i) => <div key={h} className={i === 0 ? "text-start" : ""}>{h}</div>)}
            </div>
            <div className="mt-3 space-y-3">
              {(r.items ?? []).map((l, i) => {
                const total = l.lineTotal ?? 0
                const tax = l.taxAmount ?? 0
                return (
                  <div key={i} className={`grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 md:rounded-none md:border-none md:bg-transparent md:p-2 ${cols}`}>
                    <div className="font-semibold">{l.productName}</div>
                    <span className="block rounded-md bg-muted px-3 py-2.5 text-center">{l.unitName || "-"}</span>
                    <Input disabled className="text-center" value={(l.unitPrice ?? 0).toFixed(2)} />
                    <Input disabled className="text-center" value={l.quantity} />
                    {!exempt && <div className="text-center font-medium">{money(total - tax)}</div>}
                    {!exempt && <div className="text-center font-medium text-orange-500">{money(tax)}</div>}
                    <div className="text-center font-bold text-success">{money(total)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className={`${box} lg:col-span-2`}>
            <h2 className="mb-6 text-xl font-bold">{t("sales.payments")}</h2>
            <div className="space-y-4">
              {/* One locked row per refund the server returns (same row as the A4 invoice); the total alone when it sends none. */}
              {((r.payments?.length ?? 0) > 0 ? r.payments! : [{ id: 0, amount: r.refundedAmount ?? 0, treasuryName: null }]).map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row">
                  <div className="w-full flex-1">
                    <div className="mb-1 hidden grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid"><span>{t("sales.amount")}</span><span>{t("sales.treasury")}</span></div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input disabled value={p.amount} />
                      <Input disabled value={p.treasuryName ?? ""} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={box}>
            <h3 className="mb-4 text-sm font-bold">{t("sales.summary")}</h3>
            <div className="space-y-3 text-sm">
              {!exempt && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.beforeTax")}</span><span className="font-semibold tabular-nums">{money((r.grandTotal ?? 0) - (r.taxAmount ?? 0))}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.vat")}</span><span className="font-semibold tabular-nums text-amber-600">{money(r.taxAmount ?? 0)}</span></div>
                </>
              )}
              {(r.discountAmount ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t("viewDoc.discount")}</span><span className="font-semibold tabular-nums text-red-500">{money(r.discountAmount ?? 0)}</span></div>}
              <hr className="border-border" />
              <div className="flex items-center justify-between"><span className="font-bold">{t("viewDoc.grandTotal")}</span><span className="text-2xl font-black tabular-nums text-primary">{formatMoney(r.grandTotal ?? 0)}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between"><span className="text-muted-foreground">{t("sales.refunded")}</span><span className="font-semibold tabular-nums text-success">{money(r.refundedAmount ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("viewDoc.remaining")}</span><span className="font-semibold tabular-nums text-red-500">{money(Math.max(0, (r.grandTotal ?? 0) - (r.refundedAmount ?? 0)))}</span></div>
            </div>
          </div>
        </div>
      </div>
    </PageBox>
  )
}
