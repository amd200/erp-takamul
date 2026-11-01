import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { DataTable, type Column, type ServerPaging } from "@/components/DataTable"

/** A report's table: header and one plain row when there is nothing, the message before the first search, and a pager. */
export function ReportTable<T extends object>({ rows, columns, loading, searched, server, rowKey, pageSize = 10 }: {
  rows: T[]; columns: Column<T>[]; loading?: boolean; searched: boolean; server?: ServerPaging; rowKey: (row: T) => string | number; pageSize?: number
}) {
  const { t } = useTranslation()
  const empty: ReactNode = null
  return (
    <div className="rounded-xl border border-border">
      <DataTable rows={rows} columns={columns} rowKey={rowKey} loading={loading} server={server} pageSize={pageSize} empty={empty}
        emptyText={searched ? t("oldReports.no_data") : t("oldReports.click_search_to_view")} />
    </div>
  )
}
