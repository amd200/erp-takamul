import { useEffect, useState } from "react"
import { FileSpreadsheet, History, Printer, RotateCcw, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { EmbeddedDialog } from "@/components/EmbeddedDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pager } from "@/components/Pager"
import { formatMoney, formatNumber } from "@/lib/format"
import { CURRENCY } from "@/modules/settings"
import { useCustomers } from "@/modules/lookups/service"
import { customerMovementApi, exportMovementExcel, movementTitle, printMovement, useCustomerMovement, type CustomerMovementItem } from "@/modules/reports/customerMovement"
import { presetRange } from "@/modules/reports/components/ReportFilters"
import { PartyPicker } from "../grid/PartyPicker"

const PAGE_SIZE = 25
const COLUMNS = ["serial", "date", "invoiceNumber", "productName", "soldQty", "salesTotal"]
type Filters = { customerId: number | null; from: string; to: string }
const initial = (customerId: number | null): Filters => ({ customerId, ...presetRange("thisMonth") })

/** A customer's purchases, product by product, over a period. Opens on the sale's customer for this month. */
export function CustomerMovementDialog({ open, onOpenChange, customerId, embedded = false }: { open: boolean; onOpenChange: (o: boolean) => void; customerId: number | null
  /** Shown inside the optics customer-tools window instead of as its own popup. */
  embedded?: boolean }) {
  const { t } = useTranslation()
  const currency = CURRENCY
  const { data: customers = [] } = useCustomers()
  const [filters, setFilters] = useState<Filters>(() => initial(customerId))
  const [applied, setApplied] = useState<Filters | null>(null)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)

  // Searches by itself when it opens on a customer.
  useEffect(() => {
    if (!open) return
    const f = initial(customerId)
    setFilters(f); setApplied(f.customerId ? f : null); setPage(0)
  }, [open, customerId])

  const { data, isFetching } = useCustomerMovement(applied?.customerId ? { customerId: applied.customerId, from: applied.from, to: applied.to, page: page + 1, pageSize: PAGE_SIZE } : null)
  const items = applied ? data?.items ?? [] : []
  const customerName = customers.find((c) => c.id === applied?.customerId)?.customerName ?? ""
  const title = movementTitle(t, customerName)
  const stats = [
    { label: t("reports.movement.totalDebit"), value: data?.totalDebit ?? 0 },
    { label: t("reports.movement.totalCredit"), value: data?.totalCredit ?? 0 },
    { label: t("reports.movement.indebtedness"), value: data?.indebtedness ?? 0 },
  ]

  const search = () => { setApplied(filters.customerId ? filters : null); setPage(0) }
  const reset = () => { const f = initial(customerId); setFilters(f); setApplied(f.customerId ? f : null); setPage(0) }
  /** Printing and Excel cover every page, not just the one on screen. */
  const withAll = async (go: (all: CustomerMovementItem[]) => void) => {
    if (!applied?.customerId || !items.length) return
    setBusy(true)
    try { go(await customerMovementApi.all({ customerId: applied.customerId, from: applied.from, to: applied.to })) } finally { setBusy(false) }
  }
  const range = applied ? `${t("sales.customer")}: ${customerName || "—"} | ${t("sales.from")}: ${applied.from} | ${t("sales.to")}: ${applied.to}` : ""

  const body = (
    <>
        <DialogHeader className={embedded ? "sr-only" : "pe-8"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2"><History className="size-5" />{title}</DialogTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={busy || !items.length}
                onClick={() => withAll((all) => printMovement({ title, filters: range, cards: stats.map((s) => ({ label: s.label, value: `${formatMoney(s.value)} ${currency}` })), items: all, t }))}><Printer />{t("reports.print")}</Button>
              <Button type="button" variant="outline" size="sm" disabled={busy || !items.length}
                onClick={() => withAll((all) => exportMovementExcel(title.replace("/", "-"), all, t))}><FileSpreadsheet />{t("reports.excel")}</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(s.value)}<span className="ms-1 text-xs font-normal text-muted-foreground">{currency}</span></span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-full sm:w-64">
            <FieldLabel>{t("sales.customer")}</FieldLabel>
            <PartyPicker parties={customers.map((c) => ({ id: c.id, name: c.customerName, phone: c.phone ?? "" }))} value={filters.customerId ?? 0} onPick={(p) => setFilters((f) => ({ ...f, customerId: p.id }))}
              placeholder={t("reports.pick")} searchPlaceholder={t("customers.search")} empty={t("pos.noCustomer")} />
          </Field>
          <Field className="w-36"><FieldLabel htmlFor="mv-from">{t("sales.from")}</FieldLabel>
            <Input id="mv-from" type="date" className="h-10" value={filters.from} max={filters.to} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></Field>
          <Field className="w-36"><FieldLabel htmlFor="mv-to">{t("sales.to")}</FieldLabel>
            <Input id="mv-to" type="date" className="h-10" value={filters.to} min={filters.from} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></Field>
          <div className="flex gap-2">
            <Button type="button" size="lg" disabled={!filters.customerId || isFetching} onClick={search}><Search />{t("common.search")}</Button>
            <Button type="button" size="lg" variant="outline" aria-label={t("reports.movement.reset")} title={t("reports.movement.reset")} onClick={reset}><RotateCcw /></Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMNS.map((c) => <TableHead key={c} className="text-xs font-medium text-muted-foreground">{t(`reports.c.${c}`)}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMNS.length} className="py-8 text-center text-muted-foreground">{isFetching ? t("common.loading") : applied ? t("reports.noRows") : t("reports.movement.pickCustomer")}</TableCell>
                </TableRow>
              ) : items.map((r, i) => (
                <TableRow key={`${r.invoiceNumber}-${i}`}>
                  <TableCell className="tabular-nums">{page * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.date ? new Intl.DateTimeFormat("en-GB").format(new Date(r.date)) : "—"}</TableCell>
                  <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                  <TableCell>{r.productName}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(r.quantity)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{formatMoney(r.salesTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pager total={data?.totalCount ?? 0} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
    </>
  )
  if (embedded) return <EmbeddedDialog>{body}</EmbeddedDialog>
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-5xl">{body}</DialogContent>
    </Dialog>
  )
}
