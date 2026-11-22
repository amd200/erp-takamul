import { PageBox } from "@/components/PageBox"
import { useCallback, useRef, useState } from "react"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useNavigate } from "react-router-dom"
import { Copy, Loader2, MoreHorizontal, Pencil, Printer, RotateCw, ShoppingCart, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
    { id: "quotationNumber", sortable: true, header: t("quotes.colNumber"), cell: (q) => q.quotationNumber },
    { id: "quotationDate", sortable: true, header: t("quotes.colDate"), cell: (q) => day(q.quotationDate ?? "") },
    { id: "customerName", sortable: true, header: t("quotes.colCustomer"), cell: (q) => q.customerName || "—" },
    { id: "createdby", sortable: true, header: t("quotes.colUser"), cell: (q) => q.createdby || "—" },
    { id: "discountAmount", sortable: true, header: t("quotes.colDiscount"), cell: (q) => formatMoney(q.discountAmount ?? 0) },
    { id: "grandTotal", sortable: true, header: t("quotes.colTotal"), cell: (q) => formatMoney(q.grandTotal ?? 0) },
    { id: "actions", header: t("quotes.colActions"), cell: (q) => {
      const item = "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground"
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={t("common.actions")}><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1">
              <DropdownMenuItem className={item} disabled={print.isPending} onSelect={() => print.mutate(q.id)}>{print.isPending && print.variables === q.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}{t("quotes.print")}</DropdownMenuItem>
              {can(P.sales.pos) && <DropdownMenuItem className={item} disabled={quotation.isLoading} onSelect={() => quotation.load(q.id)}>{quotation.loadingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}{t("quotes.openInPos")}</DropdownMenuItem>}
              {(can(P.quotes.edit) || can(P.quotes.add)) && <DropdownMenuSeparator />}
              {can(P.quotes.edit) && <DropdownMenuItem className={item} onSelect={() => nav(`/quotes/${q.id}/edit`)}><Pencil size={14} />{t("common.edit")}</DropdownMenuItem>}
              {can(P.quotes.add) && <DropdownMenuItem className={item} onSelect={() => copy.mutate({ id: q.id, key: copyKey.current }, { onSuccess: () => { copyKey.current = newIdempotencyKey(); nav("/quotes") }, onError: renewIfReused(copyKey) })}><Copy size={14} />{t("quotes.duplicate")}</DropdownMenuItem>}
              {can(P.quotes.delete) && <><DropdownMenuSeparator /><DropdownMenuItem className={`${item} text-destructive`} onSelect={() => setToDelete(q)}><Trash2 size={14} />{t("common.delete")}</DropdownMenuItem></>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    } },
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
