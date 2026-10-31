import type { TFunction } from "i18next"
import { formatMoney, formatNumber } from "@/lib/format"
import type { Cell, ValueKind } from "./types"

/** Plain text for a cell, used by the table, the CSV export and tooltips alike. */
export function cellText(value: Cell, kind: ValueKind, t: TFunction, lang: string): string {
  if (value == null || value === "") return "—"
  if (typeof value === "object") return translate(value.text, t)
  if (typeof value === "string") {
    if (kind === "date") return formatDate(value, lang, { day: "numeric", month: "short", year: "numeric" })
    return translate(value, t)
  }
  if (kind === "money") return formatMoney(value)
  if (kind === "percent") return `${value.toFixed(1)}%`
  return formatNumber(value)
}

export const translate = (text: string, t: TFunction) => (text.startsWith("t:") ? t(text.slice(2)) : text)

/** Server dates come either as a bare day ("2026-10-19") or with a time; only the day is shown. Midday avoids a time-zone shift to the day before. */
function formatDate(value: string, lang: string, opts: Intl.DateTimeFormatOptions) {
  const day = value.slice(0, 10)
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(day) ? day + "T12:00:00" : value)
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat(lang, opts).format(d)
}

export const shortDate = (iso: string, lang: string) => formatDate(iso, lang, { day: "numeric", month: "short" })
