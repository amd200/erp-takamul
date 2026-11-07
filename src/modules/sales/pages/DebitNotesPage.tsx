import { useState } from "react"
import { Link } from "react-router-dom"
import { FilePlus2, FileText, Plus, Printer, RefreshCw, ScrollText } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
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

  const columns: Column<DebitNoteDto>[] = [
    { id: "number", sortKey: "debitNoteNumber", header: t("sales.debitNumber"), cell: (d) => <span className="font-semibold">{d.debitNoteNumber}</span> },
    { id: "invoice", sortKey: "salesOrderNumber", header: t("sales.invoice"), cell: (d) => <Link to={`/sales/invoices/${d.salesOrderId}`} className="hover:underline">{d.salesOrderNumber}</Link> },
    { id: "date", sortKey: "issueDate", header: t("common.date"), cell: (d) => <span className="text-muted-foreground">{formatDateTime(d.issueDate ?? "", i18n.language)}</span> },
    { id: "customer", sortKey: "customerName", header: t("sales.customer"), cell: (d) => d.customerName },
    { id: "createdBy", sortKey: "createdByName", header: t("users.userName"), cell: (d) => d.createdByName || d.createdBy || "—" },
    { id: "total", sortKey: "grandTotal", header: t("sales.grandTotal"), cell: (d) => <span className="font-semibold">{formatMoney(d.grandTotal ?? 0)}</span> },
    ...(stage2 ? [{ id: "zatca", sortKey: "zatcaStatus", header: t("sales.zatcaStatus"), cell: (d: DebitNoteDto) => <ZatcaBadge status={d.zatcaStatus} /> }] : []),
    { id: "actions", header: "", align: "end", cell: (d) => (
      <div className="flex items-center justify-end gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("sales.actions.printA4")} disabled={print.isPending} onClick={() => print.mutate({ note: d, paper: "a4" })}><FileText /></Button></TooltipTrigger>
          <TooltipContent>{t("sales.actions.printA4")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("sales.actions.printRoll")} disabled={print.isPending} onClick={() => print.mutate({ note: d, paper: "roll" })}><Printer /></Button></TooltipTrigger>
          <TooltipContent>{t("sales.actions.printRoll")}</TooltipContent>
        </Tooltip>
        {stage2 && can(P.sales.zatca) && (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("sales.actions.resendDebit")} disabled={send.isPending} onClick={() => send.mutate(d.id)}><RefreshCw className={send.isPending && send.variables === d.id ? "animate-spin" : ""} /></Button></TooltipTrigger>
            <TooltipContent>{t("sales.actions.resendDebit")}</TooltipContent>
          </Tooltip>
        )}
        {stage2 && (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("sales.menu.zatcaResponse")} onClick={() => setZatcaDoc(d)}><ScrollText /></Button></TooltipTrigger>
            <TooltipContent>{t("sales.menu.zatcaResponse")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader title={t("sales.debitTitle")} description={t("sales.debitDescription")}
        actions={<Can perm={P.sales.debitAdd}><Button asChild size="lg"><Link to="/sales/debit-notes/create"><Plus />{t("sales.newDebit")}</Link></Button></Can>} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} sort={sort} rowKey={(d) => d.id}
            searchText={(d) => `${d.debitNoteNumber} ${d.salesOrderNumber} ${d.customerName} ${d.reason}`} searchPlaceholder={t("sales.searchDebit")}
            empty={<EmptyState icon={<FilePlus2 />} title={t("sales.emptyDebit")} hint={t("sales.emptyDebitHint")} />} />
        </SectionCard>
      <ZatcaResponseDialog doc={zatcaDoc && { number: zatcaDoc.debitNoteNumber, zatcaStatus: zatcaDoc.zatcaStatus, zatcaResponse: zatcaDoc.zatcaResponse }} onOpenChange={(o) => !o && setZatcaDoc(null)} />
    </>
  )
}
