import { Link } from "react-router-dom"
import { FilePlus2, FileText, Plus, Printer, Send } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatDateTime } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { ZatcaBadge } from "../components/StatusBadges"
import { useDebitNotes, useSendDebitNote } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { DebitNoteDto } from "../types"
import { usePrintDebitNote } from "../print/usePrintDebitNote"

export default function DebitNotesPage() {
  const { t, i18n } = useTranslation()
  const stage2 = useAppSettings().taxSetting?.taxSetting === "SecondStage"
  const can = useCan()
  const { data, isLoading } = useDebitNotes()
  const send = useSendDebitNote()
  const print = usePrintDebitNote()

  const columns: Column<DebitNoteDto>[] = [
    { id: "number", header: t("sales.debitNumber"), cell: (d) => <span className="font-semibold">{d.debitNoteNumber}</span> },
    { id: "invoice", header: t("sales.invoice"), cell: (d) => <Link to={`/sales/invoices/${d.salesOrderId}`} className="hover:underline">{d.salesOrderNumber}</Link> },
    { id: "date", header: t("common.date"), cell: (d) => <span className="text-muted-foreground">{formatDateTime(d.issueDate ?? "", i18n.language)}</span> },
    { id: "customer", header: t("sales.customer"), cell: (d) => d.customerName },
    { id: "createdBy", header: t("users.userName"), cell: (d) => d.createdByName || d.createdBy || "—" },
    { id: "total", header: t("sales.grandTotal"), cell: (d) => <span className="font-semibold">{formatMoney(d.grandTotal ?? 0)}</span> },
    ...(stage2 ? [{ id: "zatca", header: t("sales.zatcaStatus"), cell: (d: DebitNoteDto) => <ZatcaBadge status={d.zatcaStatus} /> }] : []),
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
        {stage2 && can(P.sales.zatca) && d.zatcaStatus !== "Sent" && <Button variant="ghost" size="icon" aria-label={t("sales.actions.resend")} disabled={send.isPending} onClick={() => send.mutate(d.id)}><Send /></Button>}
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.sales")]} title={t("sales.debitTitle")} description={t("sales.debitDescription")}
        actions={<Can perm={P.sales.debitAdd}><Button asChild size="lg"><Link to="/sales/debit-notes/create"><Plus />{t("sales.newDebit")}</Link></Button></Can>} />
      <SectionCard>
          <DataTable rows={data} loading={isLoading} columns={columns} rowKey={(d) => d.id}
            searchText={(d) => `${d.debitNoteNumber} ${d.salesOrderNumber} ${d.customerName} ${d.reason}`} searchPlaceholder={t("sales.searchDebit")}
            empty={<EmptyState icon={<FilePlus2 />} title={t("sales.emptyDebit")} hint={t("sales.emptyDebitHint")} />} />
        </SectionCard>
    </>
  )
}
