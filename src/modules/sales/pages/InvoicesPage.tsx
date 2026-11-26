import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useBranchColumn } from "@/modules/branches/useBranchColumn"
import { FileText, RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppSettings } from "@/modules/settings"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/DataTable"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatDateTime, formatMoney } from "@/lib/format"
import { InvoiceActions } from "../components/InvoiceActions"
import { InvoicePreviewDialog } from "../components/InvoicePreviewDialog"
import { NotesDialog } from "../components/NotesDialog"
import { ZatcaResponseDialog } from "../components/ZatcaResponseDialog"
import { InvoicePaymentsDialog } from "../components/InvoicePaymentsDialog"
import { PaymentBadge, ReturnBadge, ZatcaBadge } from "../components/StatusBadges"
import { useInvoicePage } from "../queries"
import { SectionCard } from "@/components/SectionCard"
import type { Channel, SalesOrderDto } from "../types"

const PAGE_SIZE = 20

/** One page for both invoice lists: A4 invoices and invoices issued from the point of sale. The server pages and searches. */
export default function InvoicesPage({ channel }: { channel: Channel }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const can = useCan()
  const stage2 = useAppSettings().taxSetting?.taxSetting === "SecondStage"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key?: string; desc: boolean }>({ desc: false })
  const { data, isLoading, isFetching, isError, refetch } = useInvoicePage({ page: page + 1, pageSize: PAGE_SIZE, searchTerm: search, channel, sortBy: sort.key, sortDescending: sort.desc })
  const [payments, setPayments] = useState<SalesOrderDto | null>(null)
  const [notes, setNotes] = useState<SalesOrderDto | null>(null)
  const [preview, setPreview] = useState<SalesOrderDto | null>(null)
  const [zatcaDoc, setZatcaDoc] = useState<SalesOrderDto | null>(null)
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])

  const branchColumn = useBranchColumn<SalesOrderDto>((i) => ({ id: i.branchId, name: i.branchShortName }))
  const columns: Column<SalesOrderDto>[] = [
    { id: "orderNumber", sortable: true, header: t("sales.number"), cell: (i) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="font-semibold">{i.orderNumber}</span><ReturnBadge className="px-1.5 py-0 text-[10px] leading-4 whitespace-nowrap" isPartiallyReturned={i.isPartiallyReturned} isFullyReturned={i.isFullyReturned} /></span> },
    { id: "orderDate", sortable: true, className: "min-w-44", header: t("common.dateTime"), cell: (i) => <span className="text-muted-foreground">{formatDateTime(i.orderDate ?? "", i18n.language)}</span> },
    ...branchColumn,
    { id: "customerName", sortable: true, header: t("sales.customer"), cell: (i) => i.customerName },
    { id: "employeeName", sortable: true, header: t("users.userName"), cell: (i) => i.employeeName || "—" },
    ...(stage2 ? [{ id: "zatcaStatus", sortable: true, header: t("sales.zatcaStatus"), cell: (i: SalesOrderDto) => <ZatcaBadge status={i.zatcaStatus} message={i.zatcaStatus === "Rejected" ? i.zatcaResponse : null} /> }] : []),
    { id: "grandTotal", sortable: true, header: t("sales.grandTotal"), cell: (i) => <span className="font-semibold">{formatMoney(i.grandTotal ?? 0)}</span> },
    { id: "paymentStatus", sortable: true, header: t("sales.paymentStatus"), cell: (i) => <PaymentBadge status={i.paymentStatus} /> },
    { id: "totalPaid", sortable: true, header: t("sales.paid"), cell: (i) => formatMoney(i.totalPaid ?? 0) },
    { id: "actions", header: "", align: "end", cell: (i) => <InvoiceActions invoice={i} channel={channel} onPayments={() => setPayments(i)} onNotes={() => setNotes(i)} onZatcaResponse={() => setZatcaDoc(i)} onPreview={() => setPreview(i)} /> },
  ]

  return (
    <>
      <PageHeader title={t(channel === "A4" ? "sales.a4Title" : "sales.posTitle")} description={t(channel === "A4" ? "sales.a4Description" : "sales.posDescription")} />

      <SectionCard>
          <DataTable
            rows={data?.items}
            loading={isLoading}
            columns={columns}
            rowKey={(i) => i.id}
            onRowClick={can(P.sales.view) ? (i) => navigate(`/sales/invoices/${i.id}`) : undefined}
            searchPlaceholder={t("sales.searchInvoices")}
            server={{ total: data?.totalCount ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading,
              sort: { key: sort.key, desc: sort.desc, onSort: (key, desc) => { setSort({ key, desc }); setPage(0) } } }}
            empty={isError
              ? <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} />
              : <EmptyState icon={<FileText />} title={t("sales.emptyInvoices")} hint={t("sales.emptyInvoicesHint")} />}
          />
        </SectionCard>

      {/* Read from the page data so a recorded payment shows up without closing the dialog. */}
      <InvoicePaymentsDialog invoice={payments && (data?.items.find((i) => i.id === payments.id) ?? payments)} onOpenChange={(o) => !o && setPayments(null)} />
      <InvoicePreviewDialog invoice={preview} onOpenChange={(o) => !o && setPreview(null)} />
      <NotesDialog invoice={notes} onOpenChange={(o) => !o && setNotes(null)} />
      <ZatcaResponseDialog doc={zatcaDoc && { number: zatcaDoc.orderNumber, zatcaStatus: zatcaDoc.zatcaStatus, zatcaResponse: zatcaDoc.zatcaResponse }} onOpenChange={(o) => !o && setZatcaDoc(null)} />
    </>
  )
}

export const A4InvoicesPage = () => <InvoicesPage channel="A4" />
export const PosInvoicesPage = () => <InvoicesPage channel="POS" />
