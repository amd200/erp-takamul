import { useState } from "react"

export type Fiscal = { fiscalYear: string; fiscalQuarter: string; from: string; to: string }

export const FISCAL_YEARS = ["2022", "2023", "2024", "2025", "2026"]
export const FISCAL_QUARTERS = [
  { value: "Q1", label: "الربع الأول Q1 (يناير - مارس)", from: "-01-01", to: "-03-31" },
  { value: "Q2", label: "الربع الثاني Q2 (أبريل - يونيو)", from: "-04-01", to: "-06-30" },
  { value: "Q3", label: "الربع الثالث Q3 (يوليو - سبتمبر)", from: "-07-01", to: "-09-30" },
  { value: "Q4", label: "الربع الرابع Q4 (أكتوبر - ديسمبر)", from: "-10-01", to: "-12-31" },
]

const day = (d: Date) => d.toLocaleDateString("en-CA")
const initial = (): Fiscal => {
  const now = new Date()
  return { fiscalYear: String(now.getFullYear()), fiscalQuarter: "", from: day(new Date(now.getFullYear(), now.getMonth(), 1)), to: day(now) }
}

/**
 * The filters of a report as the current system has them: a fiscal year and quarter that fill the dates, the dates,
 * and what was searched (the report only loads after the first search, and reads the searched values, not the typed ones).
 */
export function useFiscalFilters() {
  const [filters, setFilters] = useState<Fiscal>(initial)
  const [applied, setApplied] = useState<Fiscal>(filters)
  const [searched, setSearched] = useState(false)
  const quarterOf = (value: string) => FISCAL_QUARTERS.find((q) => q.value === value)

  const setYear = (year: string) => setFilters((p) => {
    const q = quarterOf(p.fiscalQuarter)
    return { ...p, fiscalYear: year, from: q && year ? `${year}${q.from}` : p.from, to: q && year ? `${year}${q.to}` : p.to }
  })
  const setQuarter = (quarter: string) => setFilters((p) => {
    const q = quarterOf(quarter)
    const year = p.fiscalYear || String(new Date().getFullYear())
    return { ...p, fiscalQuarter: quarter, from: q ? `${year}${q.from}` : p.from, to: q ? `${year}${q.to}` : p.to }
  })
  const set = (patch: Partial<Fiscal>) => setFilters((p) => ({ ...p, ...patch }))
  const search = () => { setApplied(filters); setSearched(true) }
  const clear = () => { const reset = initial(); setFilters(reset); setApplied(reset); setSearched(false) }

  return { filters, applied, searched, setYear, setQuarter, set, search, clear }
}
