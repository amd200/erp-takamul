const moneyFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numFmt = new Intl.NumberFormat("en-US")

export const formatMoney = (n: number) => moneyFmt.format(n)
export const formatNumber = (n: number) => numFmt.format(n)

/**
 * Dates and times look the same everywhere: "26 Oct 2026 · 1:05:30 PM". The time always has seconds and follows
 * the language's 12/24-hour style. It is wrapped so right-to-left text can't glue it to the year.
 */
const LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069)

/** A time of day ("13:05" or "13:05:30") in the shared style, or "" when it is empty. */
export function formatClock(value: string | null | undefined, lang: string): string {
  const m = value?.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return ""
  return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(2000, 0, 1, Number(m[1]), Number(m[2]), Number(m[3] ?? 0)))
}

/** The time of day in a server date ("2026-10-26T13:05:00"), or "" when it carries none (a bare day or midnight). */
export function timeOf(value: string | null | undefined, lang: string): string {
  const m = value?.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m || (m[1] === "00" && m[2] === "00" && !Number(m[3] ?? 0))) return ""
  return formatClock(`${m[1]}:${m[2]}:${m[3] ?? "00"}`, lang)
}

/** "26 Oct 2026" */
export function formatDay(value: string | Date | null | undefined, lang: string): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value) : value
  return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric" }).format(d)
}

/**
 * Date and time as one text. `time` overrides the time part when the server sends it apart from the date
 * (a reservation's "20:00"); otherwise it is read from `value`. Without a time only the date shows.
 */
export function formatDateTime(value: string | Date | null | undefined, lang: string, time?: string | null): string {
  const day = formatDay(value, lang)
  if (!day) return "—"
  const clock = time ? formatClock(time, lang) : typeof value === "string" ? timeOf(value, lang) : new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(value as Date)
  return clock ? `${day} · ${LRI}${clock}${PDI}` : day
}
