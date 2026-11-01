import { Loader2, Lock, Printer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatClock, formatMoney, formatNumber, formatQty } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAppSettings } from "@/modules/settings"
import { useShiftReport } from "../queries"
import { useShiftReportOutput } from "../print/useShiftReportOutput"
import type { Shift } from "../types"

const money = (v: number | null | undefined) => formatMoney(v ?? 0)

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", tone)}>{value}</span>
    </div>
  )
}

/** A table from `sm` up; on a phone the same rows read as cards (`cards`), so nothing scrolls sideways. */
function Block({ title, cards, children }: { title: string; cards: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-2 md:hidden">{cards}</div>
      <div className="max-md:hidden">{children}</div>
    </section>
  )
}

function RowCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border px-3 py-2.5">
      <div className="mb-1.5 border-b border-dashed pb-1.5 text-sm font-semibold">{title}</div>
      <dl className="flex flex-col gap-1 text-xs">
        {rows.map((r) => <div key={r.label} className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{r.label}</dt><dd className="font-medium tabular-nums">{r.value}</dd></div>)}
      </dl>
    </div>
  )
}

const head = (labels: string[]) => (
  <TableHeader><TableRow className="hover:bg-transparent">{labels.map((l, i) => <TableHead key={l} className={cn("text-xs text-muted-foreground", i > 0 && "text-end")}>{l}</TableHead>)}</TableRow></TableHeader>
)

/** The shift statement in erpv2's look: a dialog with a title and who / when, stat tiles, a table per block, and the buttons at the bottom. */
export function ShiftReportModern({ shift, onOpenChange, onClose }: { shift: Shift | null; onOpenChange: (o: boolean) => void; onClose?: (s: Shift) => void }) {
  const { t, i18n } = useTranslation()
  const appSettings = useAppSettings()
  const withVouchers = !!appSettings.shiftsTab?.enableShiftStatement
  const showByEmployee = appSettings.salonsTab?.showServiceEmployeeSales === true
  const exempt = appSettings.taxSetting?.taxSetting === "Exempt"
  const { data: r, isLoading } = useShiftReport(shift?.id)
  const output = useShiftReportOutput()
  const clock = (v: string | null | undefined) => (v ? formatClock(v, i18n.language) : "---")
  const treasuries = r?.treasuries ?? []
  const employees = r?.employeeSalesSummary ?? []
  const items = r?.soldItems ?? []

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent className="overscroll-contain sm:flex sm:max-h-[90dvh] sm:max-w-3xl sm:flex-col sm:overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("shiftOld.dailyStatement")}{r ? ` · ${t("shiftOld.shiftNumber")} #${r.shiftId}` : ""}</DialogTitle>
          <DialogDescription>
            {r && [r.employeeName, r.shiftDate?.slice(0, 10), `${clock(r.startTime)} → ${r.endTime ? clock(r.endTime) : "---"}`].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
        {isLoading ? <div className="h-60 animate-pulse rounded-xl bg-muted" /> : !r ? <p className="py-8 text-center text-muted-foreground">{t("shiftOld.noData")}</p> : (
          <div className="flex flex-col gap-5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label={t("shiftOld.grandTotal")} value={money(r.salesGrandTotal)} tone="text-success" />
              <Stat label={t("shiftOld.returns")} value={money(r.returnInvoicesTotal)} tone={r.returnInvoicesTotal ? "text-destructive" : undefined} />
              <Stat label={t("shiftOld.netSales")} value={money(r.netTotal)} />
              <Stat label={t("shiftOld.invoicesCount")} value={formatNumber(r.salesInvoicesCount ?? 0)} />
              {!exempt && <Stat label={t("shiftOld.beforeTax")} value={money(r.salesSubTotal)} />}
              {!exempt && <Stat label={t("shiftOld.totalTax")} value={money(r.salesTaxAmount)} />}
              {(r.totalExpenses ?? 0) > 0 && <Stat label={t("shiftOld.totalExpenses")} value={money(r.totalExpenses)} />}
              {(r.totalPurchases ?? 0) > 0 && <Stat label={t("shiftOld.totalPurchases")} value={money(r.totalPurchases)} />}
              {(r.deferredSalesInvoicesCount ?? 0) > 0 && <Stat label={`${t("shiftOld.deferred")} (${r.deferredSalesInvoicesCount})`} value={money(r.deferredSalesInvoicesTotal)} />}
            </div>

            {treasuries.length > 0 && (
              <Block title={t("shiftOld.treasuriesDaily")} cards={treasuries.map((x) => (
                <RowCard key={x.treasuryId} title={x.treasuryName} rows={[
                  { label: t("shiftOld.invoicesCount"), value: formatNumber(x.invoicesCount) },
                  { label: t("shiftOld.totalSales"), value: money(x.totalSales) },
                  { label: t("shiftOld.totalReturns"), value: money(x.totalReturns) },
                  { label: t("shiftOld.netSales"), value: money(x.netTotal) },
                  ...(withVouchers ? [{ label: t("shiftOld.voucherCount"), value: formatNumber(x.paymentCount ?? 0) }, { label: t("shiftOld.voucherTotal"), value: money(x.paymentTotal) }] : []),
                ]} />
              ))}>
                <Table>
                  {head([t("sales.treasury"), t("shiftOld.invoicesCount"), t("shiftOld.totalSales"), t("shiftOld.totalReturns"), t("shiftOld.netSales"), ...(withVouchers ? [t("shiftOld.voucherCount"), t("shiftOld.voucherTotal")] : [])])}
                  <TableBody>{treasuries.map((x) => (
                    <TableRow key={x.treasuryId}>
                      <TableCell className="font-medium">{x.treasuryName}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(x.invoicesCount)}</TableCell>
                      {[x.totalSales, x.totalReturns, x.netTotal].map((v, i) => <TableCell key={i} className="text-end tabular-nums">{money(v)}</TableCell>)}
                      {withVouchers && <><TableCell className="text-end tabular-nums">{formatNumber(x.paymentCount ?? 0)}</TableCell><TableCell className="text-end tabular-nums">{money(x.paymentTotal)}</TableCell></>}
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Block>
            )}

            {showByEmployee && employees.length > 0 && (
              <Block title={t("shiftOld.employeeDaily")} cards={employees.map((x, i) => (
                <RowCard key={i} title={x.employeeName || "—"} rows={[
                  { label: t("shiftOld.orders"), value: formatNumber(x.salesInvoicesCount) },
                  { label: t("shiftOld.totalReturns"), value: money(x.totalReturns) },
                  { label: t("shiftOld.net"), value: money(x.netSales) },
                ]} />
              ))}>
                <Table>
                  {head([t("shiftOld.userName"), t("shiftOld.orders"), t("shiftOld.totalReturns"), t("shiftOld.net")])}
                  <TableBody>{employees.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{x.employeeName || "—"}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(x.salesInvoicesCount)}</TableCell>
                      <TableCell className="text-end tabular-nums">{money(x.totalReturns)}</TableCell>
                      <TableCell className="text-end tabular-nums">{money(x.netSales)}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Block>
            )}

            {items.length > 0 && (
              <Block title={`${t("shiftOld.statement")} (${t("shiftOld.sales")})`} cards={items.map((x, i) => (
                <RowCard key={i} title={x.productName} rows={[
                  { label: t("shiftOld.quantity"), value: formatQty(x.quantity) },
                  { label: t("shiftOld.price"), value: money(x.unitPrice) },
                  { label: t("shiftOld.total"), value: money(x.lineTotal) },
                ]} />
              ))}>
                <Table className="table-fixed">
                  <colgroup><col /><col className="w-20" /><col className="w-24" /><col className="w-28" /></colgroup>
                  {head([t("shiftOld.product"), t("shiftOld.quantity"), t("shiftOld.price"), t("shiftOld.total")])}
                  <TableBody>{items.map((x, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium whitespace-normal break-words" title={x.productName}>{x.productName}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatQty(x.quantity)}</TableCell>
                      <TableCell className="text-end tabular-nums">{money(x.unitPrice)}</TableCell>
                      <TableCell className="text-end tabular-nums">{money(x.lineTotal)}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </Block>
            )}
          </div>
        )}
        </div>

        <DialogFooter className="shrink-0 max-sm:grid max-sm:grid-cols-2 max-sm:[&>*:last-child:nth-child(odd)]:col-span-2">
          <Button variant="outline" disabled={isLoading || !r || output.isPending} onClick={() => shift && output.mutate({ id: shift.id, as: "print" })}>
            {output.isPending ? <Loader2 className="animate-spin" /> : <Printer />}{t("shiftOld.print")}
          </Button>
          {shift?.status === "Open" && onClose && <Button variant="destructive" onClick={() => onClose(shift)}><Lock />{t("shiftOld.closeShift")}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
