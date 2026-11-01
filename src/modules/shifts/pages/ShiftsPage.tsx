import { useCallback, useState } from "react"
import { Clock, Eye, FileDown, Loader2, Plus, RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DataTable, type Column } from "@/components/DataTable"
import { useTableSort } from "@/components/useTableSort"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatClock } from "@/lib/format"
import { Can, useCan } from "@/shared/permissions/usePermission"
import { P } from "@/shared/permissions/permissions"
import type { Shift } from "../types"
import { OpenShiftDialog } from "../components/OpenShiftDialog"
import { ShiftReportDialog } from "../components/ShiftReportDialog"
import { SectionCard } from "@/components/SectionCard"
import { useCloseShift, useShifts } from "../queries"
import { useShiftReportOutput } from "../print/useShiftReportOutput"

const clock = (v: string | null, lang: string) => formatClock(v, lang) || "—"

export default function ShiftsPage() {
  const { t, i18n } = useTranslation()
  const can = useCan()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const { sort, sortBy, sortDescending } = useTableSort(() => setPage(0))
  const { data, isLoading, isFetching, isError, refetch } = useShifts({ page: page + 1, pageSize: 20, searchTerm: search, sortBy, sortDescending })
  const onSearch = useCallback((value: string) => { setSearch((previous) => { if (previous !== value) setPage(0); return value }) }, [])
  const close = useCloseShift()
  const output = useShiftReportOutput()
  const [opening, setOpening] = useState(false)
  const [viewing, setViewing] = useState<Shift | null>(null)
  const [toClose, setToClose] = useState<Shift | null>(null)
  const date = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "numeric" })
  const day = (v: string | null) => (v ? date.format(new Date(v)) : "—")

  const columns: Column<Shift>[] = [
    { id: "id", sortKey: "id", header: "#", cell: (s) => <span className="font-semibold tabular-nums">{s.id}</span> },
    { id: "date", sortKey: "shiftDate", header: t("common.date"), cell: (s) => <span className="text-muted-foreground">{day(s.shiftDate)}</span> },
    { id: "start", sortKey: "startTime", header: t("shifts.start"), cell: (s) => <span dir="ltr">{clock(s.startTime, i18n.language)}</span> },
    { id: "end", sortKey: "endTime", header: t("shifts.end"), cell: (s) => (s.endTime ? <span dir="ltr">{clock(s.endTime, i18n.language)}</span> : <span className="text-faint">—</span>) },
    { id: "employee", sortKey: "employeeName", header: t("shifts.employee"), cell: (s) => s.employeeName || "—" },
    { id: "branch", sortKey: "branchName", header: t("shifts.branch"), cell: (s) => <span className="text-muted-foreground">{s.branchName || "—"}</span> },
    { id: "device", sortKey: "deviceName", header: t("shifts.device"), cell: (s) => <span className="text-muted-foreground">{s.deviceName || "—"}</span> },
    { id: "opening", sortKey: "openingBalance", header: t("shifts.openingBalance"), cell: (s) => s.openingBalance == null ? "—" : formatMoney(s.openingBalance) },
    { id: "sales", sortKey: "totalSales", header: t("shifts.sales"), cell: (s) => <span className="font-medium">{s.totalSales == null ? "—" : formatMoney(s.totalSales)}</span> },
    { id: "status", sortKey: "status", header: t("common.status"), cell: (s) => s.status !== "Open" && s.status !== "Closed" ? "—" : <StatusBadge tone={s.status === "Open" ? "success" : "danger"}>{t(s.status === "Open" ? "shifts.statusOpen" : "shifts.statusClosed")}</StatusBadge> },
    { id: "actions", header: "", align: "end", cell: (s) => {
      const pdfBusy = output.isPending && output.variables?.id === s.id
      return (
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("shifts.downloadPdf")} disabled={pdfBusy} onClick={() => output.mutate({ id: s.id, as: "pdf" })}>{pdfBusy ? <Loader2 className="animate-spin" /> : <FileDown />}</Button></TooltipTrigger>
            <TooltipContent>{t("shifts.downloadPdf")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={t("shifts.viewReport")} onClick={() => setViewing(s)}><Eye /></Button></TooltipTrigger>
            <TooltipContent>{t("shifts.viewReport")}</TooltipContent>
          </Tooltip>
        </div>
      )
    } },
  ]

  return (
    <>
      <PageHeader crumbs={[t("nav.shifts")]} title={t("shifts.title")} description={t("shifts.description")}
        actions={<Can perm={P.shifts.open}><Button size="lg" onClick={() => setOpening(true)}><Plus />{t("shifts.open")}</Button></Can>} />
      <SectionCard>
        <DataTable rows={data?.items ?? []} loading={isLoading} columns={columns} rowKey={(s) => s.id} sort={sort}
          server={{ total: data?.totalCount ?? 0, page, pageSize: data?.pageSize ?? 20, onPage: setPage, onSearch, fetching: isFetching }} searchPlaceholder={t("shifts.search")}
          empty={isError
            ? <EmptyState icon={<RotateCw />} title={t("common.loadFailed")} hint={t("common.loadFailedHint")} action={<Button variant="outline" onClick={() => refetch()}>{t("common.retry")}</Button>} />
            : <EmptyState icon={<Clock />} title={t("shifts.empty")} hint={t("shifts.emptyHint")} />} />
      </SectionCard>

      <OpenShiftDialog open={opening} onOpenChange={setOpening} />
      <ShiftReportDialog shift={viewing} onOpenChange={(o) => !o && setViewing(null)} onClose={can(P.shifts.close) ? setToClose : undefined} />
      <ConfirmDialog open={!!toClose} onOpenChange={(o) => !o && setToClose(null)} pending={close.isPending}
        title={t("shifts.closeTitle")} description={t("shifts.closeBody", { id: toClose?.id })} confirmLabel={t("shifts.close")}
        onConfirm={() => toClose && close.mutate(toClose.id, { onSuccess: () => { setToClose(null); setViewing(null) } })} />
    </>
  )
}
