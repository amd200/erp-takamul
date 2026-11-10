import { PageBox } from "@/components/PageBox"
import { useCallback, useRef, useState } from "react"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { Link, useNavigate } from "react-router-dom"
import { Copy, Loader2, Pencil, Printer, RotateCw, ShoppingCart, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { formatMoney, formatDateTime } from "@/lib/format"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAppSettings } from "@/modules/settings"
import { useLoadQuotation } from "@/modules/pos/useLoadQuotation"
import { useDeleteQuote, useDuplicateQuote, useQuotePage } from "../queries"
import type { Quote } from "../types"
import { usePrintQuote } from "../print/usePrintQuote"

const PAGE_SIZE = 20

function IconAction({ label, onClick, to, children, danger, disabled }: { label: string; onClick?: () => void; to?: string; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild={!!to} type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick} disabled={disabled} className={danger ? "hover:bg-destructive-soft hover:text-destructive" : undefined}>
          {to ? <Link to={to}>{children}</Link> : <span>{children}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Price quotations, a page at a time; the server searches. */
export default function QuotesPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const nav = useNavigate()
  const postype = useAppSettings().salesScreenTab?.postype
  const posPath = postype === "Pos3" ? "/pos-optics" : postype === "Pos2" ? "/pos2" : "/pos"
  const quotation = useLoadQuotation(() => nav(posPath))
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const { sort, sortBy, sortDescending } = useTableSort(() => setPage(0))
  const { data, isLoading, isFetching, isError, refetch } = useQuotePage({ page: page + 1, pageSize: PAGE_SIZE, searchTerm: search, sortBy, sortDescending })
  const del = useDeleteQuote()
  const copy = useDuplicateQuote()
  const copyKey = useRef(newIdempotencyKey())
  const print = usePrintQuote()
  const [toDelete, setToDelete] = useState<Quote | null>(null)
  const day = (v: string) => (v ? formatDateTime(v, i18n.language) : "—")
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])

  // The same seven columns, in the same order and wording, as the current system.
  const columns: Column<Quote>[] = [
    { id: "number", sortKey: "quotationNumber", header: t("quotes.colNumber"), cell: (q) => q.quotationNumber },
    { id: "date", sortKey: "quotationDate", header: t("quotes.colDate"), cell: (q) => day(q.quotationDate ?? "") },
    { id: "customer", sortKey: "customerName", header: t("quotes.colCustomer"), cell: (q) => q.customerName || "—" },
    { id: "by", sortKey: "createdby", header: t("quotes.colUser"), cell: (q) => q.createdby || "—" },
    { id: "discount", sortKey: "discountAmount", header: t("quotes.colDiscount"), cell: (q) => formatMoney(q.discountAmount ?? 0) },
    { id: "total", sortKey: "grandTotal", header: t("quotes.colTotal"), cell: (q) => formatMoney(q.grandTotal ?? 0) },
    { id: "actions", header: t("quotes.colActions"), cell: (q) => (
      <div className="flex justify-center gap-2">
        <IconAction label={t("quotes.print")} disabled={print.isPending} onClick={() => print.mutate(q.id)}>{print.isPending && print.variables === q.id ? <Loader2 className="animate-spin" /> : <Printer />}</IconAction>
        {can(P.sales.pos) && <IconAction label={t("quotes.openInPos")} disabled={quotation.isLoading} onClick={() => quotation.load(q.id)}>{quotation.loadingId === q.id ? <Loader2 className="animate-spin" /> : <ShoppingCart />}</IconAction>}
        {can(P.quotes.edit) && <IconAction label={t("common.edit")} to={`/quotes/${q.id}/edit`}><Pencil /></IconAction>}
        {can(P.quotes.add) && <IconAction label={t("quotes.duplicate")} onClick={() => copy.mutate({ id: q.id, key: copyKey.current }, { onSuccess: () => { copyKey.current = newIdempotencyKey(); nav("/quotes") }, onError: renewIfReused(copyKey) })}><Copy /></IconAction>}
        {can(P.quotes.delete) && <IconAction label={t("common.delete")} danger onClick={() => setToDelete(q)}><Trash2 /></IconAction>}
      </div>
    ) },
  ]

  return (
    <>
      <PageBox title={t("quotes.listTitle")} subtitle={t("quotes.listSubtitle")}>
        <DataTable rows={data?.items} loading={isLoading} columns={columns} rowKey={(q) => q.id} sort={sort} searchPlaceholder={t("quotes.searchOld")}
          server={{ total: data?.totalCount ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading }}
          emptyText={isError ? undefined : t("quotes.noData")}
          empty={<EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} />} />
      </PageBox>
      {quotation.confirmation}
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("quotes.deleteTitle")} description={t("quotes.deleteBody", { number: toDelete?.quotationNumber })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSettled: () => setToDelete(null) })} />
    </>
  )
}
