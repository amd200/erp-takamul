import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom"
import { FileSpreadsheet, MousePointerClick, Printer, SearchX } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import { PageHeader } from "@/components/PageHeader"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { RequirePermission } from "@/shared/permissions/RequirePermission"
import { CURRENCY } from "@/modules/settings"
import { ReportFilters, presetRange, type Preset } from "../components/ReportFilters"
import { ReportTable } from "../components/ReportTable"
import { loadDataset } from "../dataset"
import { LIVE } from "../live"
import { reportById } from "../definitions"
import { downloadCsv } from "../export"
import type { Filters, ReportDef, Stat } from "../types"

const TONE = { good: "text-success", warn: "text-warning", bad: "text-destructive", muted: "text-muted-foreground" } as const

function StatTile({ s }: { s: Stat }) {
  const { t } = useTranslation()
  const currency = CURRENCY
  const text = s.kind === "money" ? formatMoney(s.value) : s.kind === "percent" ? `${s.value.toFixed(1)}%` : formatNumber(s.value)
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{t(`reports.k.${s.id}`)}</span>
      <span className={cn("text-lg font-semibold tabular-nums", s.tone && TONE[s.tone])}>
        {text}{s.kind === "money" && <span className="ms-1 text-xs font-normal text-muted-foreground">{currency}</span>}
      </span>
    </div>
  )
}

function Report({ def }: { def: ReportDef }) {
  const { t, i18n } = useTranslation()
  const [preset, setPreset] = useState<Preset>("thisMonth")
  const [params] = useSearchParams()
  // Other pages link straight to a statement: /reports/customer-statement?customer=2
  const fromUrl = (k: string) => Number(params.get(k)) || undefined
  const [filters, setFilters] = useState<Filters>({ ...presetRange("thisMonth"), top: 10, customerId: fromUrl("customer"), supplierId: fromUrl("supplier"), productId: fromUrl("product") })
  const missing = (def.requires ?? []).filter((r) => !filters[`${r}Id` as const])
  const { data, isLoading } = useQuery({
    queryKey: ["reports", def.id, filters],
    // Reports the server serves are read from it; the rest still run on the sample data.
    queryFn: async () => (LIVE[def.id] ? LIVE[def.id](filters) : def.run(await loadDataset(), filters)),
    enabled: missing.length === 0,
    placeholderData: (prev) => prev,
  })
  const title = t(`reports.r.${def.id}`)
  const choosePreset = (p: Preset) => { setPreset(p); if (p !== "custom") setFilters((f) => ({ ...f, ...presetRange(p) })) }

  return (
    <>
      <PageHeader crumbs={[t("nav.reports"), t(`reports.cat.${def.category}`)]} title={title} description={t(`reports.d.${def.id}`)}
        actions={data && missing.length === 0 && (
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="lg" onClick={() => downloadCsv(`${def.id}-${filters.from}-${filters.to}`, data, t, i18n.language)}><FileSpreadsheet />{t("reports.excel")}</Button>
            <Button variant="outline" size="lg" onClick={() => window.print()}><Printer />{t("reports.print")}</Button>
          </div>
        )} />

      <Card className="print:hidden"><CardContent>
        <ReportFilters keys={def.filters} required={def.requires ?? []} value={filters} preset={preset} onChange={setFilters} onPreset={choosePreset} />
      </CardContent></Card>
      {def.filters.includes("period") && <p className="hidden text-sm print:block">{t("reports.printedPeriod", { from: filters.from, to: filters.to })}</p>}

      {missing.length > 0 ? (
        <Card><EmptyState icon={<MousePointerClick />} title={t(`reports.need.${missing[0]}`)} hint={t("reports.needHint")} /></Card>
      ) : isLoading || !data ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <>
          <div className={cn("grid gap-3", data.stats.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : data.stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {data.stats.map((s) => <StatTile key={s.id} s={s} />)}
          </div>
          <Card>
            <CardContent>
              {data.rows.length === 0
                ? <EmptyState icon={<SearchX />} title={t("reports.noRows")} hint={t("reports.noRowsHint")} />
                : <ReportTable columns={data.columns} rows={data.rows} totals={data.totals} />}
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}

export default function ReportPage() {
  const { id } = useParams()
  return <ReportById id={id} />
}

export function ReportById({ id }: { id?: string }) {
  const def = reportById(id)
  if (!def) return <Navigate to="/reports" replace />
  return (
    <RequirePermission perm={def.perm} key={def.id}>
      <Report def={def} />
    </RequirePermission>
  )
}

export function ReportLink({ def }: { def: ReportDef }) {
  const { t } = useTranslation()
  const Icon = def.icon
  return (
    <Link to={`/reports/${def.id}`} className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
      <span className="min-w-0">
        <span className="block font-semibold group-hover:text-primary">{t(`reports.r.${def.id}`)}</span>
        <span className="block text-sm text-muted-foreground">{t(`reports.d.${def.id}`)}</span>
      </span>
    </Link>
  )
}
