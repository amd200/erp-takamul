import { useState } from "react"
import { useBranchColumn } from "@/modules/branches/useBranchColumn"
import { Link } from "react-router-dom"
import { Eye, FileText, DollarSign, Printer, ScrollText, Send, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { RowMenu } from "@/components/RowActions"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { SectionCard } from "@/components/SectionCard"
import { formatDateTime, formatMoney } from "@/lib/format"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { PaymentBadge, ZatcaBadge } from "../components/StatusBadges"
import { ZatcaResponseDialog } from "../components/ZatcaResponseDialog"
import { ReturnRefundsDialog } from "../components/ReturnRefundsDialog"
import { useReturns, useSendReturn } from "../queries"
import { usePrintReturn } from "../print/usePrintReturn"
import type { SalesReturnDto } from "../types"

export default function ReturnsPage() {
  const { t, i18n } = useTranslation()
  const ops = useAppSettings().operationsTab
  const stage2 = useAppSettings().taxSetting?.taxSetting === "SecondStage"
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useReturns({ SortBy: sortBy, SortDescending: sortDescending })
  const send = useSendReturn()
  const print = usePrintReturn()
  const [zatcaDoc, setZatcaDoc] = useState<SalesReturnDto | null>(null)
  const [refundsId, setRefundsId] = useState<number | null>(null)

  const branchColumn = useBranchColumn<SalesReturnDto>((r) => ({ id: r.branchId, name: r.branchShortName }))
  const columns: Column<SalesReturnDto>[] = [
    { id: "returnNumber", sortable: true, header: t("sales.returnNumber"), cell: (r) => <span className="font-semibold">{r.returnNumber}</span> },
    { id: "salesOrderNumber", sortable: true, header: t("sales.invoice"), cell: (r) => <Link to={`/sales/invoices/${r.salesOrderId}`} className="hover:underline">{r.salesOrderNumber}</Link> },
    { id: "returnDate", sortable: true, className: "min-w-44", header: t("common.date"), cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.returnDate ?? "", i18n.language)}</span> },
    ...branchColumn,
    { id: "customerName", sortable: true, header: t("sales.customer"), cell: (r) => r.customerName },
    { id: "grandTotal", sortable: true, header: t("sales.grandTotal"), cell: (r) => <span className="font-semibold">{formatMoney(r.grandTotal ?? 0)}</span> },
    { id: "paymentStatus", sortable: true, header: t("sales.paymentStatus"), cell: (r) => <PaymentBadge status={r.paymentStatus} /> },
    { id: "refundedAmount", sortable: true, header: t("sales.refunded"), cell: (r) => (r.refundedAmount ? formatMoney(r.refundedAmount) : <span className="text-faint">—</span>) },
    ...(stage2 ? [{ id: "zatcaStatus", sortable: true, header: t("sales.zatcaStatus"), cell: (r: SalesReturnDto) => <ZatcaBadge status={r.zatcaStatus} /> }] : []),
    { id: "actions", header: "", align: "end", cell: (r) => <RowMenu items={[
      { key: "a4", label: t("sales.actions.printA4"), icon: <FileText />, disabled: print.isPending, onSelect: () => print.mutate({ ret: r, paper: "a4" }) },
      { key: "roll", label: t("sales.actions.printRoll"), icon: <Printer />, disabled: print.isPending, onSelect: () => print.mutate({ ret: r, paper: "roll" }) },
      stage2 && can(P.sales.zatca) && r.zatcaStatus !== "Sent" && { key: "resend", label: t("sales.actions.resend"), icon: <Send />, disabled: send.isPending, onSelect: () => send.mutate(r.id) },
      stage2 && { key: "zatca", label: t("sales.menu.zatcaResponse"), icon: <ScrollText />, onSelect: () => setZatcaDoc(r) },
      true && { key: "refunds", label: t("sales.menu.payments"), icon: <DollarSign />, onSelect: () => setRefundsId(r.id) },
      { key: "view", label: t("common.view"), icon: <Eye />, to: `/sales/returns/${r.id}` },
    ]} /> },
  ]

  return (
    <>
      <PageHeader title={t("sales.returnsTitle")} description={t("sales.returnsDescription")} />
      <SectionCard>
        <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(r) => r.id}
          searchText={(r) => `${r.returnNumber} ${r.salesOrderNumber} ${r.customerName}`} searchPlaceholder={t("sales.searchReturns")}
          empty={<EmptyState icon={<Undo2 />} title={t("sales.emptyReturns")} hint={t("sales.emptyReturnsHint")} />} />
      </SectionCard>
      <ReturnRefundsDialog returnId={refundsId} onOpenChange={(o) => !o && setRefundsId(null)} />
      <ZatcaResponseDialog doc={zatcaDoc && { number: zatcaDoc.returnNumber, zatcaStatus: zatcaDoc.zatcaStatus, zatcaResponse: zatcaDoc.zatcaResponse }} onOpenChange={(o) => !o && setZatcaDoc(null)} />
    </>
  )
}
