import type { LucideIcon } from "lucide-react"
import type { Permission } from "@/shared/permissions/permissions"
import type { Dataset } from "./dataset"

export const REPORT_CATEGORIES = ["items", "sales", "purchases", "customers", "suppliers", "expenses", "profits"] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export type FilterKey = "period" | "product" | "customer" | "supplier" | "employee" | "category" | "top"
export type Filters = {
  from: string
  to: string
  productId?: number
  customerId?: number
  supplierId?: number
  employeeId?: number
  categoryId?: number
  top?: number
}

export type ValueKind = "text" | "money" | "number" | "date" | "percent" | "badge"
export type Tone = "good" | "warn" | "bad" | "muted"

/** A column's header is the i18n key "reports.c.<id>". */
export type Column = { id: string; kind: ValueKind; strong?: boolean }
export type Cell = string | number | null | { text: string; tone: Tone }
export type Row = Record<string, Cell>

/** A summary tile; label is the i18n key "reports.k.<id>". */
export type Stat = { id: string; value: number; kind: "money" | "number" | "percent"; tone?: Tone }

export type ReportResult = {
  stats: Stat[]
  columns: Column[]
  rows: Row[]
  totals?: Row
}

export type ReportDef = {
  id: string
  category: ReportCategory
  icon: LucideIcon
  perm: Permission
  filters: FilterKey[]
  /** Filters that must be chosen before the report runs (a statement needs its customer). */
  requires?: ("product" | "customer" | "supplier")[]
  run: (data: Dataset, f: Filters) => ReportResult
}
