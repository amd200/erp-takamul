import type { TFunction } from "i18next"
import { cellText } from "./format"
import type { ReportResult } from "./types"

/** Excel-readable CSV (UTF-8 with BOM so Arabic opens correctly), including the totals row. */
export function downloadCsv(name: string, r: ReportResult, t: TFunction, lang: string) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const header = r.columns.map((c) => t(`reports.c.${c.id}`))
  // Raw numbers (not formatted) so Excel can sum them.
  const value = (row: ReportResult["rows"][number], c: ReportResult["columns"][number]) => {
    const v = row[c.id]
    return typeof v === "number" && c.kind !== "date" ? String(v) : v == null ? "" : cellText(v, c.kind, t, lang)
  }
  const lines = [header, ...r.rows.map((row) => r.columns.map((c) => value(row, c)))]
  if (r.totals) lines.push(r.columns.map((c, i) => (i === 0 ? t("reports.total") : value(r.totals!, c))))
  const blob = new Blob(["﻿" + lines.map((l) => l.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
