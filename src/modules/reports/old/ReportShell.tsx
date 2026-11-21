import { PageBox } from "@/components/PageBox"
import type { ReactNode } from "react"
import { FileSpreadsheet, FileText, Loader2, Printer, RotateCcw, Search, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FISCAL_QUARTERS, FISCAL_YEARS, type useFiscalFilters } from "./useFiscalFilters"

const COLORS = {
  purple: ["bg-purple-50", "text-purple-600"], blue: ["bg-blue-50", "text-blue-600"], green: ["bg-success-soft", "text-success"],
  red: ["bg-red-50", "text-red-600"], teal: ["bg-teal-50", "text-teal-600"], slate: ["bg-slate-50", "text-slate-600"], orange: ["bg-orange-50", "text-orange-600"],
} as const

export type SummaryCard = { title: string; value: string | number; suffix?: string; icon?: LucideIcon; color?: keyof typeof COLORS }

/** The summary tiles above a report: a coloured icon, the title and the figure. */
export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => {
        const [bg, fg] = COLORS[c.color ?? "blue"]
        const Icon = c.icon
        return (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-4">
              {Icon && <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", bg)}><Icon size={24} className={fg} /></div>}
              <div className="flex-1 text-start">
                <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{c.title}</p>
                <h3 className="flex items-baseline gap-1 text-2xl font-bold text-slate-900">
                  {c.value}{c.suffix && <span className="text-xs font-medium text-slate-400">{c.suffix}</span>}
                </h3>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** The titled box every report sits in, with print, PDF and Excel on its corner. */
export function ReportShell({ title, icon: Icon, onPrint, onPdf, onExcel, pdfBusy, children }: {
  title: string; icon: LucideIcon; onPrint: () => void; onPdf: () => void; onExcel: () => void; pdfBusy?: boolean; children: ReactNode
}) {
  const { t } = useTranslation()
  const action = "flex items-center gap-1.5 text-slate-600 transition-colors hover:text-primary disabled:opacity-50 dark:text-slate-400"
  return (
    <PageBox icon={Icon} title={title}
      action={<div className="flex items-center gap-4 text-sm font-medium">
            <button type="button" onClick={onPrint} className={action}><Printer size={16} /><span className="hidden sm:inline">{t("oldReports.print")}</span></button>
            <button type="button" onClick={onPdf} disabled={pdfBusy} className={action}>{pdfBusy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}<span className="hidden sm:inline">PDF</span></button>
            <button type="button" onClick={onExcel} className={action}><FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span></button>
      </div>}>
      <div className="space-y-4">{children}</div>
    </PageBox>
  )
}

type Filters = ReturnType<typeof useFiscalFilters>

/** Fiscal year and quarter, the two dates and the search / reset buttons; `extra` adds a report's own filters before the dates. */
export function FiscalFilters({ f, loading, extra, withFiscal = true, dates = true }: { f: Filters; loading?: boolean; extra?: ReactNode; withFiscal?: boolean; dates?: boolean }) {
  const { t } = useTranslation()
  const field = "space-y-2"
  const label = "text-xs font-medium"
  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {withFiscal && (
          <>
            <div className={field}>
              <Label className={label}>{t("oldReports.fiscal_year")}</Label>
              <Select value={f.filters.fiscalYear} onValueChange={f.setYear}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("oldReports.select_year")} /></SelectTrigger>
                <SelectContent>{FISCAL_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className={field}>
              <Label className={label}>{t("oldReports.fiscal_quarter")}</Label>
              <Select value={f.filters.fiscalQuarter} onValueChange={f.setQuarter}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("oldReports.select_quarter")} /></SelectTrigger>
                <SelectContent>{FISCAL_QUARTERS.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </>
        )}
        {extra}
        {dates && (
          <>
        <div className={field}>
          <Label className={label}>{t("oldReports.from_date")}</Label>
          <DatePicker value={f.filters.from} onChange={(v) => f.set({ from: v })} />
        </div>
        <div className={field}>
          <Label className={label}>{t("oldReports.to_date")}</Label>
          <DatePicker value={f.filters.to} onChange={(v) => f.set({ to: v })} />
        </div>
          </>
        )}
        <div className="mb-2 flex flex-row items-end gap-2">
          <Button type="button" onClick={f.search} disabled={loading} className="h-9 flex-1 gap-2 rounded-lg px-4 font-bold shadow-sm"><Search size={16} />{t("oldReports.search")}</Button>
          <Button type="button" onClick={f.clear} variant="outline" className="h-9 gap-1 px-3" aria-label={t("oldReports.reset")}><RotateCcw size={15} className="text-primary" /></Button>
        </div>
      </div>
    </div>
  )
}
