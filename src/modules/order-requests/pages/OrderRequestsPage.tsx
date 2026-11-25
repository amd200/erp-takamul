import { useCallback, useRef, useState } from "react"
import { CheckCheck, ClipboardList, Eye, Pencil, Plus, Printer, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { RowMenu } from "@/components/RowActions"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatDateTime } from "@/lib/format"
import { newIdempotencyKey, renewIfReused } from "@/shared/http/idempotency"
import { useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import { useAppSettings } from "@/modules/settings"
import { useOpenOrderRequest } from "../useOpenOrderRequest"
import { PaymentScreen } from "@/modules/pos/payment/PaymentScreen"
import type { PosPayment } from "@/modules/pos/types"
import type { OrderRequest } from "../types"
import { SectionCard } from "@/components/SectionCard"
import { usePrintOrderRequest } from "../print/usePrintOrderRequest"
import { useCheckoutOrderRequest, useDeleteOrderRequest, useMarkReady, useOrderRequest, useOrderRequestPage } from "../queries"

const PAGE_SIZE = 20

function DetailsDialog({ id, onOpenChange }: { id: number | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const exempt = useAppSettings().taxSetting?.taxSetting === "Exempt"
  const { data: o, isLoading } = useOrderRequest(id)
  return (
    <Dialog open={id != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("orderRequests.orderTitle", { number: o?.orderNumber ?? "" })}</DialogTitle>
          <DialogDescription>{o && [o.customerName, o.customerPhone].filter(Boolean).join(" · ")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isLoading || !o ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : (
            <div className="flex flex-col gap-4">
              <Table className="min-w-[420px]">
                <TableHeader><TableRow className="hover:bg-transparent">{[t("products.item"), t("products.quantity"), t("sales.unitPrice"), t("sales.lineTotal")].map((h) => <TableHead key={h} className="text-muted-foreground">{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {(o.items ?? []).map((i, k) => (
                    <TableRow key={k}>
                      <TableCell><div className="font-medium">{i.productName}</div>{i.notes && <div className="text-xs text-muted-foreground">{i.notes}</div>}</TableCell>
                      <TableCell className="tabular-nums">{i.quantity}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(i.unitPrice ?? 0)}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatMoney(i.lineTotal ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {o.notes && <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">{o.notes}</p>}
              <dl className="ms-auto flex w-full max-w-xs flex-col gap-1.5 text-sm tabular-nums">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("sales.subTotal")}</dt><dd>{formatMoney(o.subTotal ?? 0)}</dd></div>
                {(o.discountAmount ?? 0) > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">{t("sales.discount")}</dt><dd>-{formatMoney(o.discountAmount ?? 0)}</dd></div>}
                {!exempt && <div className="flex justify-between"><dt className="text-muted-foreground">{t("sales.tax")}</dt><dd>{formatMoney(o.taxAmount ?? 0)}</dd></div>}
                <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>{t("sales.grandTotal")}</dt><dd>{formatMoney(o.grandTotal ?? 0)}</dd></div>
              </dl>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

/** Orders customers placed to be prepared and paid at the counter. */
export default function OrderRequestsPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const openInPos = useOpenOrderRequest()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const { sort, sortBy, sortDescending } = useTableSort(() => setPage(0))
  const { data, isLoading, isFetching } = useOrderRequestPage({ page: page + 1, pageSize: PAGE_SIZE, searchTerm: search, from, to, sortBy, sortDescending })
  const ready = useMarkReady()
  const checkout = useCheckoutOrderRequest()
  const print = usePrintOrderRequest()
  const del = useDeleteOrderRequest()
  const [toDelete, setToDelete] = useState<OrderRequest | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const [paying, setPaying] = useState<OrderRequest | null>(null)
  // One key per order being paid, so a double click or a retry after a dropped connection pays it once.
  const key = useRef(newIdempotencyKey())
  const onSearch = useCallback((q: string) => { setSearch((prev) => { if (prev !== q) setPage(0); return q }) }, [])
  const manage = can(P.orderRequests.view)

  const confirmPay = (payments: PosPayment[]) => {
    if (!paying) return
    checkout.mutate({ id: paying.id, payments, key: key.current }, { onSuccess: () => { setPaying(null); key.current = newIdempotencyKey() }, onError: renewIfReused(key) })
  }

  const columns: Column<OrderRequest>[] = [
    { id: "orderNumber", sortable: true, header: t("orderRequests.number"), cell: (o) => <span className="font-semibold">{o.orderNumber}</span> },
    { id: "customerName", sortable: true, header: t("sales.customer"), cell: (o) => <div><div>{o.customerName || "—"}</div>{o.customerPhone && <div className="text-xs text-muted-foreground" dir="ltr">{o.customerPhone}</div>}</div> },
    { id: "orderDate", sortable: true, header: t("common.date"), cell: (o) => <span className="text-muted-foreground">{o.orderDate ? formatDateTime(o.orderDate, i18n.language) : "—"}</span> },
    { id: "itemsCount", sortable: true, header: t("orderRequests.items"), cell: (o) => o.itemsCount },
    { id: "grandTotal", sortable: true, header: t("sales.grandTotal"), cell: (o) => <span className="font-semibold">{formatMoney(o.grandTotal ?? 0)}</span> },
    { id: "status", sortable: true, header: t("common.status"), cell: (o) => <StatusBadge tone={o.salesOrderId ? "success" : "warning"}>{o.salesOrderId ? t("orderRequests.invoiced") : t(`orderRequests.statuses.${o.status}`, { defaultValue: o.status || t("orderRequests.pending") })}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (o) => (
      <div className="flex items-center justify-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={t("sales.actions.view")} onClick={() => setViewing(o.id)}><Eye /></Button>
          </TooltipTrigger>
          <TooltipContent>{t("sales.actions.view")}</TooltipContent>
        </Tooltip>
        <RowMenu items={[
        { key: "roll", label: t("sales.actions.printRoll"), icon: <Printer />, disabled: print.isPending, onSelect: () => print.mutate(o.id) },
        manage && !o.salesOrderId && { key: "edit", label: t("common.edit"), icon: <Pencil />, onSelect: () => openInPos.edit(o.id) },
        manage && !o.salesOrderId && { key: "ready", label: t("orderRequests.markReady"), icon: <CheckCheck />, disabled: ready.isPending, onSelect: () => ready.mutate(o.id) },
        manage && !o.salesOrderId && { key: "checkout", label: t("orderRequests.checkout"), icon: <Wallet />, onSelect: () => setPaying(o) },
        manage && !o.salesOrderId && { key: "delete", label: t("common.delete"), icon: <Trash2 />, destructive: true, onSelect: () => setToDelete(o) },
        ]} />
      </div>
    ) },
  ]

  return (
    <>
      <PageHeader title={t("orderRequests.title")} description={t("orderRequests.description")}
        actions={manage && <Button onClick={openInPos.add}><Plus />{t("orderRequests.add")}</Button>} />
      <SectionCard>
        <DataTable rows={data?.items} loading={isLoading} columns={columns} rowKey={(o) => o.id} sort={sort} searchPlaceholder={t("orderRequests.search")}
          server={{ total: data?.totalCount ?? 0, page, pageSize: PAGE_SIZE, onPage: setPage, onSearch, fetching: isFetching && !isLoading }}
          filters={
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DatePicker clearable value={from} max={to || undefined} onChange={(v) => { setFrom(v); setPage(0) }} className="w-44" />
              {t("sales.to")}
              <DatePicker clearable value={to} min={from || undefined} onChange={(v) => { setTo(v); setPage(0) }} className="w-44" />
            </div>
          }
          empty={<EmptyState icon={<ClipboardList />} title={t("orderRequests.empty")} hint={t("orderRequests.emptyHint")} />} />
      </SectionCard>

      {openInPos.confirmation}
      <DetailsDialog id={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} pending={del.isPending}
        title={t("orderRequests.deleteTitle")} description={t("orderRequests.deleteBody", { number: toDelete?.orderNumber })}
        onConfirm={() => toDelete && del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
      <PaymentScreen requestCheckout open={!!paying} onOpenChange={(o) => !o && setPaying(null)} total={paying?.grandTotal ?? 0} hasCustomer={!!paying?.customerId} customerName={paying?.customerName ?? ""} pending={checkout.isPending} onConfirm={confirmPay} />
    </>
  )
}
