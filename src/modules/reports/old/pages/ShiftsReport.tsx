import { useState } from "react"
import { FileDown, Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { shiftsApi } from "@/modules/shifts/service"
import type { Shift } from "@/modules/shifts/types"
import { money } from "../output"
import { PagedReport } from "../PagedReport"

const time12 = (v?: string | null) => {
  if (!v) return "---"
  const [h, m] = v.split(":")
  const hours = Number(h)
  return `${hours % 12 || 12}:${m} ${hours >= 12 ? "م" : "ص"}`
}

/** Every shift with its times, user, status and net total, and a button that downloads one shift's PDF report. The server pages the list. */
export default function ShiftsReport() {
  const { t } = useTranslation()
  const [busyId, setBusyId] = useState<number | null>(null)
  const download = async (id: number) => {
    setBusyId(id)
    try {
      const blob = await shiftsApi.export(id)
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `shift-${id}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } finally { setBusyId(null) }
  }
  const status = (r: Shift) => (r.status === "Open" ? t("oldReports.shift_status_open") : t("oldReports.shift_status_closed"))
  return (
    <PagedReport<Shift, Awaited<ReturnType<typeof shiftsApi.list>>>
      id="shifts" title={t("oldReports.shifts_report")} icon={RefreshCw} dates={false}
      filterText={() => t("oldReports.all_shifts")}
      read={(_, page, size) => shiftsApi.list({ page, pageSize: size })}
      rowsOf={(r) => r.items} totalOf={(r) => r.totalCount} rowKey={(r) => r.id}
      cards={() => []}
      columns={[
        { id: "id", header: t("oldReports.shift_id"), cell: (r) => <span className="font-bold">{r.id}</span> },
        { id: "open", header: t("oldReports.open_time"), cell: (r) => time12(r.startTime) },
        { id: "close", header: t("oldReports.close_time"), cell: (r) => <span className={!r.endTime ? "font-medium text-blue-500" : ""}>{time12(r.endTime)}</span> },
        { id: "user", header: t("oldReports.user"), cell: (r) => r.employeeName },
        { id: "status", header: t("oldReports.status"), cell: (r) => <span className={r.status === "Open" ? "font-medium text-blue-500" : ""}>{status(r)}</span> },
        { id: "total", header: t("oldReports.total"), cell: (r) => <span className="font-bold text-primary">{money(r.netTotal)}</span> },
        { id: "actions", header: t("oldReports.actions"), cell: (r) => (
          <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full text-primary" disabled={busyId !== null} title={t("oldReports.download_shift_report_pdf")} aria-label={`${t("oldReports.download_shift_report_pdf")} #${r.id}`} onClick={() => download(r.id)}>
            {busyId === r.id ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          </Button>
        ) },
      ]}
      outColumns={[
        { header: t("oldReports.shift_id"), value: (r) => r.id },
        { header: t("oldReports.open_time"), value: (r) => time12(r.startTime) },
        { header: t("oldReports.close_time"), value: (r) => time12(r.endTime) },
        { header: t("oldReports.user"), value: (r) => r.employeeName },
        { header: t("oldReports.status"), value: (r) => status(r) },
        { header: t("oldReports.total"), value: (r) => money(r.netTotal) },
      ]} />
  )
}
