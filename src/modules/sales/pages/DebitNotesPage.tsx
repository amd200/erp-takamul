import { useState } from "react"
import { useBranchColumn } from "@/modules/branches/useBranchColumn"
import { Link } from "react-router-dom"
import { FilePlus2, FileText, Printer, RefreshCw, ScrollText } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { RowMenu } from "@/components/RowActions"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatDateTime } from "@/lib/format"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { ZatcaBadge } from "../components/StatusBadges"
import { ZatcaResponseDialog } from "../components/ZatcaResponseDialog"
import { useDebitNotes, useSendDebitNote } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { DebitNoteDto } from "../types"
import { usePrintDebitNote } from "../print/usePrintDebitNote"

export default function DebitNotesPage() {
  const { t, i18n } = useTranslation()
  const stage2 = useAppSettings().taxSetting?.taxSetting === "SecondStage"
  const can = useCan()
  const { sort, sortBy, sortDescending } = useTableSort()
  const { data, isLoading } = useDebitNotes({ SortBy: sortBy, SortDescending: sortDescending })
  const send = useSendDebitNote()
  const print = usePrintDebitNote()
  const [zatcaDoc, setZatcaDoc] = useState<DebitNoteDto | null>(null)

  const branchColumn = useBranchColumn<DebitNoteDto>((d) => ({ name: d.branchName }))
  const columns: Column<DebitNoteDto>[] = [
    { id: "debitNoteNumber", sortable: true, header: t("sales.debitNumber"), cell: (d) => <span className="font-semibold">{d.debitNoteNumber}</span> },
    { id: "salesOrderNumber", sortable: true, header: t("sales.invoice"), cell: (d) => <Link to={`/sales/invoices/${d.salesOrderId}`} className="hover:underline">{d.salesOrderNumber}</Link> },
    { id: "issueDate", sortable: true, className: "min-w-44", header: t("common.date"), cell: (d) => <span className="text-muted-foreground">{formatDateTime(d.issueDate ?? "", i18n.language)}</span> },
    ...branchColumn,
    { id: "customerName", sortable: true, header: t("sales.customer"), cell: (d) => d.customerName },
    { id: "createdByName", sortable: true, header: t("users.userName"), cell: (d) => d.createdByName || d.createdBy || "—" },
    { id: "grandTotal", sortable: true, header: t("sales.grandTotal"), cell: (d) => <span className="font-semibold">{formatMoney(d.grandTotal ?? 0)}</span> },
    ...(stage2 ? [{ id: "zatcaStatus", sortable: true, header: t("sales.zatcaStatus"), cell: (d: DebitNoteDto) => <ZatcaBadge status={d.zatcaStatus} /> }] : []),
    { id: "actions", header: "", align: "end", cell: (d) => <RowMenu items={[
      { key: "a4", label: t("sales.actions.printA4"), icon: <FileText />, disabled: print.isPending, onSelect: () => print.mutate({ note: d, paper: "a4" }) },
      { key: "roll", label: t("sales.actions.printRoll"), icon: <Printer />, disabled: print.isPending, onSelect: () => print.mutate({ note: d, paper: "roll" }) },
      stage2 && can(P.sales.zatca) && { key: "resend", label: t("sales.actions.resendDebit"), icon: <RefreshCw />, loading: send.isPending && send.variables === d.id, disabled: send.isPending, onSelect: () => send.mutate(d.id) },
      stage2 && { key: "zatca", label: t("sales.menu.zatcaResponse"), icon: <ScrollText />, onSelect: () => setZatcaDoc(d) },
    ]} /> },
  ]

  return (
    <>
      <PageHeader title={t("sales.debitTitle")} description={t("sales.debitDescription")} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(d) => d.id}
            searchText={(d) => `${d.debitNoteNumber} ${d.salesOrderNumber} ${d.customerName} ${d.reason}`} searchPlaceholder={t("sales.searchDebit")}
            empty={<EmptyState icon={<FilePlus2 />} title={t("sales.emptyDebit")} hint={t("sales.emptyDebitHint")} />} />
        </SectionCard>
      <ZatcaResponseDialog doc={zatcaDoc && { number: zatcaDoc.debitNoteNumber, zatcaStatus: zatcaDoc.zatcaStatus, zatcaResponse: zatcaDoc.zatcaResponse }} onOpenChange={(o) => !o && setZatcaDoc(null)} />
    </>
  )
}
