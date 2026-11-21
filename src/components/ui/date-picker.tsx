import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * A date field: a button looking like the other inputs that opens a calendar. The value is the same `yyyy-MM-dd` string a native
 * `<input type="date">` gives ("" when empty), so forms, schemas and services stay as they were. Shown in the UI language.
 */
type Ymd = { y: number; m: number; d: number } // m is 0-based

const pad = (n: number) => String(n).padStart(2, "0")
const toStr = ({ y, m, d }: Ymd) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s?: string): Ymd | null => {
  const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? "")
  return r ? { y: +r[1], m: +r[2] - 1, d: +r[3] } : null
}
const utc = ({ y, m, d }: Ymd) => new Date(Date.UTC(y, m, d))
const fromUtc = (dt: Date): Ymd => ({ y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() })
const addDays = (v: Ymd, n: number) => fromUtc(new Date(utc(v).getTime() + n * 864e5))
const addMonths = (v: Ymd, n: number): Ymd => {
  const dt = new Date(Date.UTC(v.y, v.m + n, 1))
  const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate()
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: Math.min(v.d, last) }
}
const localToday = (): Ymd => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() } }

// Western digits for Arabic (like the rest of the app); Latin-script Bangla uses English month and day names.
const localeOf = (lang: string) => (lang === "ar" ? "ar-u-nu-latn" : "en-GB")

type Props = {
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  id?: string
  name?: string
  min?: string
  max?: string
  /** Show a clear button (only for optional fields). */
  clearable?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  "aria-invalid"?: boolean
}

export function DatePicker({ value, onChange, onBlur, id, name, min, max, clearable, disabled, placeholder, className, ...rest }: Props) {
  const { t, i18n } = useTranslation()
  const rtl = i18n.dir() === "rtl"
  const locale = localeOf(i18n.language)
  const [open, setOpen] = useState(false)
  const selected = parse(value)
  const lo = parse(min)
  const hi = parse(max)
  const [focus, setFocus] = useState<Ymd>(selected ?? localToday())
  useEffect(() => { if (open) setFocus(selected ?? localToday()) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const outOfRange = (v: Ymd) => (lo && toStr(v) < toStr(lo)) || (hi && toStr(v) > toStr(hi))
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }), [locale])
  const monthFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }), [locale])
  const dayFmt = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }), [locale])
  const first = i18n.language === "ar" ? 6 : 0 // Saturday / Sunday
  const weekdays = Array.from({ length: 7 }, (_, i) => dayFmt.format(new Date(Date.UTC(2023, 0, 1 + ((first + i) % 7)))).replace(/^ال/, ""))

  const cells = useMemo(() => {
    const start = { y: focus.y, m: focus.m, d: 1 }
    const lead = (utc(start).getUTCDay() - first + 7) % 7
    return Array.from({ length: 42 }, (_, i) => addDays(start, i - lead))
  }, [focus.y, focus.m, first])

  const pick = (v: Ymd) => { if (outOfRange(v)) return; onChange(toStr(v)); setOpen(false) }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const col = (utc(focus).getUTCDay() - first + 7) % 7
    const step = e.key === "ArrowLeft" ? (rtl ? 1 : -1) : e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowUp" ? -7 : e.key === "ArrowDown" ? 7 : 0
    if (step) { e.preventDefault(); setFocus(addDays(focus, step)) }
    else if (e.key === "PageUp" || e.key === "PageDown") { e.preventDefault(); setFocus(addMonths(focus, e.key === "PageUp" ? -1 : 1)) }
    else if (e.key === "Home") { e.preventDefault(); setFocus(addDays(focus, -col)) }
    else if (e.key === "End") { e.preventDefault(); setFocus(addDays(focus, 6 - col)) }
  }

  // Keep keyboard focus on the focused day after it moves (only when the focus is already inside the grid).
  useEffect(() => {
    const el = document.querySelector<HTMLButtonElement>("[data-date-focus='true']")
    if (open && el && el.closest("[data-slot='popover-content']")?.contains(document.activeElement)) el.focus()
  }, [focus.y, focus.m, focus.d, open])

  const Prev = rtl ? ChevronRight : ChevronLeft
  const Next = rtl ? ChevronLeft : ChevronRight
  const todayYmd = localToday()

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) onBlur?.() }}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            name={name}
            disabled={disabled}
            aria-invalid={rest["aria-invalid"]}
            className={cn(
              "flex h-10 w-full min-w-0 items-center gap-2 rounded-sm border border-input bg-white px-3 text-start text-xs font-normal outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
              clearable && selected && "pe-9",
              className,
            )}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>{selected ? fmt.format(utc(selected)) : (placeholder ?? t("datePicker.pick"))}</span>
          </button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <button type="button" aria-label={t("datePicker.clear")} onClick={() => onChange("")} className="absolute inset-y-0 end-2 my-auto flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto gap-1.5 p-2.5" onKeyDown={onKey}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" aria-label={t("datePicker.prevMonth")} onClick={() => setFocus(addMonths(focus, -1))} className="flex size-7 items-center justify-center rounded-md hover:bg-muted"><Prev className="size-4" /></button>
          <div className="text-sm font-medium" aria-live="polite">{monthFmt.format(utc({ ...focus, d: 1 }))}</div>
          <button type="button" aria-label={t("datePicker.nextMonth")} onClick={() => setFocus(addMonths(focus, 1))} className="flex size-7 items-center justify-center rounded-md hover:bg-muted"><Next className="size-4" /></button>
        </div>
        <div role="grid" className="grid grid-cols-7 gap-x-1 gap-y-0.5">
          {weekdays.map((w, i) => <div key={i} className="flex h-6 w-[30px] items-center justify-center text-[10px] text-muted-foreground">{w}</div>)}
          {cells.map((c) => {
            const key = toStr(c)
            const isSel = selected && key === toStr(selected)
            const isFocus = key === toStr(focus)
            const off = !!outOfRange(c)
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                tabIndex={isFocus ? 0 : -1}
                data-date-focus={isFocus}
                disabled={off}
                aria-selected={!!isSel}
                aria-label={fmt.format(utc(c))}
                onClick={() => pick(c)}
                className={cn(
                  "flex size-[30px] items-center justify-center rounded-md text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
                  c.m !== focus.m && "text-muted-foreground/60",
                  key === toStr(todayYmd) && !isSel && "border border-primary/40",
                  isSel && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >{c.d}</button>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t pt-1.5">
          <button type="button" disabled={!!outOfRange(todayYmd)} onClick={() => pick(todayYmd)} className="rounded px-2 py-1 text-xs text-primary hover:bg-muted disabled:opacity-40">{t("datePicker.today")}</button>
          {clearable && <button type="button" onClick={() => { onChange(""); setOpen(false) }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">{t("datePicker.clear")}</button>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
