import { Link } from "react-router-dom"
import { Eye, Send, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatDateTime, formatMoney } from "@/lib/format"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { ZatcaBadge } from "../components/StatusBadges"
import { useReturns, useSendReturn } from "../queries"
import type { SalesReturnDto } from "../types"

export default function ReturnsPage() {
  const { t, i18n } = useTranslation()
  const stage2 = useAppSettings().taxSetting?.taxSetting === "SecondStage"
  const can = useCan()
  const { data, isLoading } = useReturns()
  const send = useSendReturn()

  const columns: Column<SalesReturnDto>[] = [
    { id: "number", header: t("sales.returnNumber"), cell: (r) => <span className="font-semibold">{r.returnNumber}</span> },
    { id: "invoice", header: t("sales.invoice"), cell: (r) => <Link to={`/sales/invoices/${r.salesOrderId}`} className="hover:underline">{r.salesOrderNumber}</Link> },
    { id: "date", header: t("common.date"), cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.returnDate ?? "", i18n.language)}</span> },
    { id: "customer", header: t("sales.customer"), cell: (r) => r.customerName },
    { id: "total", header: t("sales.grandTotal"), cell: (r) => <span className="font-semibold">{formatMoney(r.grandTotal ?? 0)}</span> },
    { id: "refunded", header: t("sales.refunded"), cell: (r) => (r.refundedAmount ? formatMoney(r.refundedAmount) : <span className="text-faint">—</span>) },
    ...(stage2 ? [{ id: "zatca", header: t("sales.zatcaStatus"), cell: (r: SalesReturnDto) => <ZatcaBadge status={r.zatcaStatus} /> }] : []),
    { id: "actions", header: "", align: "end", cell: (r) => (
      <div className="flex justify-end gap-0.5">
        {stage2 && can(P.sales.zatca) && r.zatcaStatus !== "Sent" && (
          <Button variant="ghost" size="icon" aria-label={t("sales.actions.resend")} disabled={send.isPending} onClick={() => send.mutate(r.id)}><Send /></Button>
        )}
        <Button asChild variant="ghost" size="icon" aria-label={t("common.view")}><Link to={`/sales/returns/${r.id}`}><Eye /></Link></Button>
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.sales")]} title={t("sales.returnsTitle")} description={t("sales.returnsDescription")} />
      <SectionCard>
        <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(r) => r.id}
          searchText={(r) => `${r.returnNumber} ${r.salesOrderNumber} ${r.customerName}`} searchPlaceholder={t("sales.searchReturns")}
          empty={<EmptyState icon={<Undo2 />} title={t("sales.emptyReturns")} hint={t("sales.emptyReturnsHint")} />} />
      </SectionCard>
    </>
  )
}
