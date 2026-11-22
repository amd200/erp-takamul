import { CircleDollarSign, FileText, Loader2, Lock, Printer, ReceiptText, Undo2, Users, Wallet, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { shiftClock } from "../clock"
import { useAppSettings } from "@/modules/settings"
import { useShiftReport } from "../queries"
import { useShiftReportOutput } from "../print/useShiftReportOutput"
import type { Shift } from "../types"

const fmt = (v: number | null | undefined) => (typeof v === "number" && !Number.isNaN(v) ? v.toFixed(2) : "00.00")

/** One row of a box: a grey caption and its value. */
const Line = ({ label, value, tone }: { label: string; value: string | number; tone?: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="font-semibold text-muted-foreground">{label}</span>
    <span className={cn("font-bold text-foreground", tone)}>{value}</span>
  </div>
)

/** A titled section of the statement, with the small coloured icon the current system puts before it. */
const Section = ({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="mb-3 flex items-center gap-2"><Icon size={16} className="text-primary" /><h3 className="text-sm font-bold">{title}</h3></div>
    {children}
  </div>
)

const Box = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-muted/50 px-3 py-2">
    {title && <div className="mb-2.5 border-b border-dashed border-border pb-2 text-xs font-bold text-foreground">{title}</div>}
    <div className="space-y-2 text-xs">{children}</div>
  </div>
)

/** One box holding a block per treasury, split by dashed lines (the grouped card of the current system). */
const Group = ({ children }: { children: React.ReactNode }) => <div className="rounded-xl border border-border bg-muted/50 px-3 py-2">{children}</div>

const Item = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="[&+div]:mt-3 [&+div]:border-t [&+div]:border-dashed [&+div]:border-border [&+div]:pt-3">
    <div className="mb-2.5 border-b border-dashed border-border pb-2 text-xs font-bold text-foreground">{title}</div>
    <div className="space-y-2 text-xs">{children}</div>
  </div>
)

/** The invoice numbers of an employee, in small boxes. */
const InvoiceNumbers = ({ title, numbers }: { title: string; numbers?: string[] | null }) => {
  if (!numbers?.length) return null
  return (
    <div className="mt-3 border-t border-dashed border-border pt-3 text-xs">
      <div className="mb-2 font-semibold text-muted-foreground">{title}</div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-2">
        {numbers.map((n, i) => <li key={`${n}-${i}`} className="min-w-0 rounded-lg border border-border bg-background px-2.5 py-2 text-center"><bdi dir="ltr" className="block break-all font-mono text-[11px] leading-5">{n}</bdi></li>)}
      </ul>
    </div>
  )
}

/**
 * The shift statement, as in the current system: a header with the title, the shift number and the close and print
 * buttons; under it the statement on a pale background (who and when, what was sold, the totals, each sales treasury, the
 * returns, expenses and collected vouchers, each service employee, then the net of each treasury).
 */
type Props = { shift: Shift | null; onOpenChange: (o: boolean) => void; onClose?: (s: Shift) => void }

export function ShiftReportDialog({ shift, onOpenChange, onClose }: Props) {
  const { t } = useTranslation()
  const appSettings = useAppSettings()
  const withVouchers = !!appSettings.shiftsTab?.enableShiftStatement
  const showReturns = !!appSettings.shiftsTab?.showReturnsInShiftPrint
  const showExpenses = !!appSettings.shiftsTab?.showExpensesInShiftReport
  const showByEmployee = appSettings.salonsTab?.showServiceEmployeeSales === true
  const exempt = appSettings.taxSetting?.taxSetting === "Exempt"
  const { data: r, isLoading } = useShiftReport(shift?.id)
  const output = useShiftReportOutput()
  const clock = shiftClock
  const showNet = (showExpenses && !!r?.expenseTreasuries?.length) || (showReturns && !!r?.returnTreasuries?.length) || (withVouchers && !!r?.unlinkedVoucherTreasuries?.length)
  const netTreasuries = showNet ? (r?.treasuries ?? []) : []

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[92dvh] w-[calc(100%-1rem)] min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl sm:max-w-xl">
        <div className="relative flex shrink-0 flex-col justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex min-w-0 items-center gap-3 pe-10 sm:pe-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={19} /></div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-foreground">{t("shiftOld.dailyStatement")}</DialogTitle>
              {r && <p className="mt-0.5 text-xs text-muted-foreground">{t("shiftOld.shiftNumber")} #{r.shiftId}</p>}
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {shift?.status === "Open" && onClose && (
              <Button onClick={() => onClose(shift)} className="h-9 flex-1 rounded-xl bg-green-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 sm:flex-none"><Lock size={14} />{t("shiftOld.closeShift")}</Button>
            )}
            <Button size="sm" disabled={isLoading || !r || output.isPending} onClick={() => shift && output.mutate({ id: shift.id, as: "print" })} className="h-9 flex-1 rounded-xl px-3.5 text-xs font-semibold shadow-sm sm:flex-none">
              {output.isPending ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}{t("shiftOld.print")}
            </Button>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t("common.close")}
            className="absolute end-4 top-4 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:static"><X size={18} /></button>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col items-center gap-3 overflow-y-auto bg-muted/30 p-3 sm:p-5">
          {isLoading ? (
            <div className="w-full max-w-[610px] space-y-4">{[8, 15, 6].map((h) => <div key={h} className="w-full animate-pulse rounded-2xl bg-muted" style={{ height: `${h / 4}rem` }} />)}</div>
          ) : r ? (
            <div className="relative w-full max-w-2xl text-start text-card-foreground">
              <div className="mb-5 rounded-xl border border-border bg-muted/30 px-4 py-2">
                <div className="flex items-start justify-between">
                  <div><span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("shiftOld.userName")}</span><span className="text-sm font-bold">{r.employeeName}</span></div>
                  <div className="text-end"><span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("shiftOld.shiftNumber")}</span><span className="text-sm font-bold">#{r.shiftId}</span></div>
                </div>
              </div>

              <div className="mb-5 flex items-stretch rounded-lg border border-border bg-card p-3">
                <div className="w-1/2 text-center">
                  <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("shiftOld.start")}</span>
                  <span className="block text-xs font-bold">{r.shiftDate?.slice(0, 10) || "—"}</span>
                  <span className="mt-1 block text-xs font-bold">{clock(r.startTime)}</span>
                </div>
                <div className="mx-3 w-px bg-border" />
                <div className="w-1/2 text-center">
                  <span className="mb-1 block text-[10px] font-bold text-muted-foreground">{t("shiftOld.end")}</span>
                  <span className="block text-xs font-bold">{r.endDate?.slice(0, 10) || "---"}</span>
                  <span className="mt-1 block text-xs font-bold">{clock(r.endTime)}</span>
                </div>
              </div>

              <Section icon={FileText} title={`${t("shiftOld.statement")} (${t("shiftOld.sales")})`}>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full table-fixed text-start text-[11px] sm:text-xs">
                    <colgroup><col className="w-[46%]" /><col className="w-[17%]" /><col className="w-[13%]" /><col className="w-[24%]" /></colgroup>
                    <thead className="border-b border-border bg-muted font-bold text-foreground">
                      <tr>
                        <th className="px-1 py-2.5 whitespace-nowrap sm:p-2.5">{t("shiftOld.product")}</th>
                        <th className="px-1 py-2.5 text-center whitespace-nowrap sm:p-2.5">{t("shiftOld.price")}</th>
                        <th className="px-1 py-2.5 text-center whitespace-nowrap sm:p-2.5">{t("shiftOld.quantity")}</th>
                        <th className="px-1 py-2.5 text-center whitespace-nowrap sm:p-2.5">{t("shiftOld.total")}</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-card-foreground">
                      {(r.soldItems ?? []).map((x, i) => (
                        <tr key={i} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/50">
                          <td className="px-1 py-2.5 break-words sm:p-2.5">{x.productName}</td>
                          <td className="px-1 py-2.5 text-center tabular-nums sm:p-2.5" dir="ltr">{fmt(x.unitPrice)}</td>
                          <td className="px-1 py-2.5 text-center tabular-nums sm:p-2.5" dir="ltr">{x.quantity}</td>
                          <td className="px-1 py-2.5 text-center font-bold tabular-nums sm:p-2.5" dir="ltr">{fmt(x.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <div className="mb-6 rounded-xl border border-border bg-muted/50 px-4 py-2">
                {!exempt && (
                  <div className="mb-3 space-y-2 border-b border-dashed border-border pb-3 font-semibold">
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{t("shiftOld.beforeTax")}</span><span>{fmt(r.salesSubTotal)}</span></div>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{t("shiftOld.totalTax")}</span><span>{fmt(r.salesTaxAmount)}</span></div>
                  </div>
                )}
                <div className="flex items-center justify-between"><span className="text-sm font-bold">{t("shiftOld.grandTotal")}</span><span className="text-lg font-black text-primary">{fmt(r.salesGrandTotal)}</span></div>
              </div>

              {(r.deferredSalesInvoicesCount ?? 0) > 0 && (
                <div className="mb-6"><Box>
                  <div className="mb-2.5 flex items-center gap-2 border-b border-dashed border-border pb-2"><ReceiptText size={16} className="text-primary" /><h3 className="text-sm font-bold">{t("shiftOld.deferred")}</h3></div>
                  <Line label={t("shiftOld.invoicesCount")} value={r.deferredSalesInvoicesCount ?? "—"} />
                  <Line label={t("shiftOld.total")} value={fmt(r.deferredSalesInvoicesTotal)} tone="font-black text-primary" />
                </Box></div>
              )}

              {(r.salesTreasuries?.length ?? 0) > 0 && (
                <Section icon={Wallet} title={`${t("shiftOld.treasuriesDaily")} (${t("shiftOld.sales")})`}>
                  <Group>
                    {(r.salesTreasuries ?? []).map((x) => (
                      <Item key={x.treasuryId} title={x.treasuryName}>
                        <Line label={t("shiftOld.invoicesCount")} value={x.invoicesCount} />
                        <Line label={t("shiftOld.totalSales")} value={fmt(x.totalSales)} tone="font-black text-primary" />
                      </Item>
                    ))}
                  </Group>
                </Section>
              )}

              {showReturns && (r.returnTreasuries?.length ?? 0) > 0 && (
                <Section icon={Undo2} title={t("shiftOld.returns")}>
                  <Group>
                    {(r.returnTreasuries ?? []).map((x) => (
                      <Item key={x.treasuryId} title={x.treasuryName}>
                        <Line label={t("shiftOld.invoicesCount")} value={x.invoicesCount} />
                        <Line label={t("shiftOld.totalReturns")} value={fmt(x.totalReturns)} tone="font-black text-destructive" />
                      </Item>
                    ))}
                  </Group>
                </Section>
              )}

              {showExpenses && (r.expenseTreasuries?.length ?? 0) > 0 && (
                <Section icon={Wallet} title={t("shiftOld.expenses")}>
                  <Group>
                    {(r.expenseTreasuries ?? []).map((x) => (
                      <Item key={x.treasuryId} title={x.treasuryName}>
                        <Line label={t("shiftOld.expensesCount")} value={x.expensesCount} />
                        <Line label={t("shiftOld.totalExpenses")} value={fmt(x.totalExpenses)} tone="font-black text-destructive" />
                      </Item>
                    ))}
                  </Group>
                </Section>
              )}

              {withVouchers && (r.unlinkedVoucherTreasuries?.length ?? 0) > 0 && (
                <Section icon={ReceiptText} title={t("shiftOld.vouchers")}>
                  <Group>
                    {(r.unlinkedVoucherTreasuries ?? []).map((x) => (
                      <Item key={x.treasuryId} title={x.treasuryName}>
                        <Line label={t("shiftOld.vouchersCount")} value={x.vouchersCount} />
                        <Line label={t("shiftOld.total")} value={fmt(x.totalAmount)} tone="font-black text-primary" />
                      </Item>
                    ))}
                  </Group>
                </Section>
              )}

              {showByEmployee && (r.employeeSalesSummary?.length ?? 0) > 0 && (
                <Section icon={Users} title={t("shiftOld.employeeDaily")}>
                  <div className="grid grid-cols-1 gap-3">
                    {(r.employeeSalesSummary ?? []).map((e, i) => (
                      <div key={e.employeeId ?? i} className="rounded-xl border border-border bg-muted/50 px-3 py-2">
                        <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-dashed border-border pb-2.5">
                          <span className="text-[10px] font-bold text-muted-foreground">{e.employeeName} ({e.salesInvoicesCount} {t("shiftOld.orders")})</span>
                          <span className="text-sm font-black">{t("shiftOld.net")} {fmt(e.netSales)}</span>
                        </div>
                        {(e.treasuries?.length ?? 0) > 0 && (
                          <div className="space-y-1.5">
                            {e.treasuries.map((x) => (
                              <div key={x.treasuryId} className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-semibold text-muted-foreground">{x.treasuryName}</span>
                                <span className="font-bold">{fmt(x.totalSales)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-dashed border-border pt-2.5 text-xs">
                          <span className="font-semibold text-muted-foreground">{t("shiftOld.totalReturns")} ({e.returnInvoicesCount ?? 0} {t("shiftOld.returnsUnit")})</span>
                          <span className="font-black">{fmt(e.totalReturns)}</span>
                        </div>
                        <InvoiceNumbers title={t("shiftOld.salesInvoiceNumbers")} numbers={e.salesInvoiceNumbers} />
                        {showReturns && <InvoiceNumbers title={t("shiftOld.returnInvoiceNumbers")} numbers={e.returnInvoiceNumbers} />}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {netTreasuries.length > 0 && (
                <Section icon={CircleDollarSign} title={t("shiftOld.netTreasuries")}>
                  <div className="grid grid-cols-1 gap-3">
                    {netTreasuries.map((x) => (
                      <Box key={x.treasuryId} title={x.treasuryName}>
                        <Line label={t("shiftOld.treasuryNet")} value={fmt(x.finalNetTotal)} tone={cn("font-black", x.finalNetTotal < 0 ? "text-destructive" : "text-primary")} />
                      </Box>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-foreground shadow-sm"><p className="font-bold">{t("shiftOld.noData")}</p></div>
          )}

          <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />{t("shiftOld.previewHint")}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
