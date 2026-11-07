import { useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { FileDown, Loader2, Printer, Undo2, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatDateTime, formatMoney } from "@/lib/format"
import { Can } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { PaymentsDialog } from "../components/PaymentsDialog"
import { PaymentBadge, ZatcaBadge } from "../components/StatusBadges"
import { TotalsPanel } from "../components/TotalsPanel"
import { useAppSettings } from "@/modules/settings"
import { useInvoice } from "../queries"
import { useInvoiceOutput } from "../print/useInvoiceOutput"
import { orderTotals } from "../totals"

export default function InvoiceDetailPage() {
  const { t, i18n } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const { id } = useParams()
  const [search] = useSearchParams()
  const channel = search.get("channel") === "POS" ? "POS" : "A4"
  const { data: inv, isLoading, isError } = useInvoice(Number(id))
  const [payments, setPayments] = useState(false)
  const output = useInvoiceOutput()
  const busy = (as: "print" | "pdf") => output.isPending && output.variables?.as === as

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted" />
  if (isError || !inv) return <EmptyState icon={<Undo2 />} title={t("sales.notFound")} action={<Button asChild variant="outline"><Link to="/sales/invoices">{t("sales.backToList")}</Link></Button>} />

  const paid = inv.totalPaid ?? 0
  const message = inv.zatcaStatus === "Rejected" ? inv.zatcaResponse : null
  const info: [string, string][] = [
    [t("sales.customer"), inv.customerName ?? ""],
    [t("common.date"), formatDateTime(inv.orderDate ?? "", i18n.language)],
    [t("sales.warehouse"), inv.warehouseName || "—"],
    [t("sales.employee"), inv.employeeName ?? "—"],
    [t("sales.createdBy"), inv.createdBy ?? ""],
    [t("sales.channel"), t(`sales.channels.${channel}`)],
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.sales"), t(channel === "A4" ? "nav.invoicesA4" : "nav.invoicesPos")]} title={inv.orderNumber ?? ""} actions={
        <>
          <Button variant="outline" size="lg" disabled={output.isPending} onClick={() => output.mutate({ invoice: inv, as: "print" })}>{busy("print") ? <Loader2 className="animate-spin" /> : <Printer />}{t("sales.actions.print")}</Button>
          <Button variant="outline" size="lg" disabled={output.isPending} onClick={() => output.mutate({ invoice: inv, as: "pdf" })}>{busy("pdf") ? <Loader2 className="animate-spin" /> : <FileDown />}{t("sales.actions.downloadPdf")}</Button>
          <Can perm={P.sales.payments}><Button variant="outline" size="lg" onClick={() => setPayments(true)}><Wallet />{t("sales.actions.payments")}</Button></Can>
          <Can perm={P.sales.returnsAdd}><Button asChild size="lg"><Link to={`/sales/returns/create?invoice=${inv.id}`}><Undo2 />{t("sales.actions.return")}</Link></Button></Can>
        </>
      } />
      <div className="flex flex-wrap gap-2">
        <PaymentBadge status={inv.paymentStatus} />
        <ZatcaBadge status={inv.zatcaStatus} message={message} />
      </div>
      {message && <div className="rounded-xl bg-destructive-soft px-4 py-3 text-destructive">{t("sales.zatcaRejectedBanner", { message })}</div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <SectionCard title={t("sales.details")}>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              {info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
            {inv.notes && <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-muted-foreground">{inv.notes}</p>}
          </SectionCard>
          <SectionCard title={t("sales.lines")}>
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {[t("products.item"), t("products.quantity"), t("sales.unitPrice"), t("sales.discount"), ...(exempt ? [] : [t("sales.tax")]), t("sales.lineTotal")].map((h) => <TableHead key={h} className="text-xs text-muted-foreground">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(inv.items ?? []).map((l, i) => {
                  return (
                    <TableRow key={i}>
                      <TableCell><div className="font-semibold">{l.productName}</div><div className="text-xs text-muted-foreground">{l.unitName}</div></TableCell>
                      <TableCell className="tabular-nums">{l.quantity}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(l.unitPrice ?? 0)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{l.discountValue ? formatMoney(l.discountValue) : "—"}</TableCell>
                      {!exempt && <TableCell className="tabular-nums text-muted-foreground">{formatMoney(l.taxAmount ?? 0)}</TableCell>}
                      <TableCell className="font-semibold tabular-nums">{formatMoney(l.lineTotal ?? 0)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SectionCard title={t("sales.summary")}><TotalsPanel totals={orderTotals(inv)} paid={paid} /></SectionCard>
        </aside>
      </div>
      <PaymentsDialog invoice={payments ? inv : null} onOpenChange={setPayments} />
    </>
  )
}
