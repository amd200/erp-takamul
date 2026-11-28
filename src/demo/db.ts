import Dexie, { type Table } from "dexie"

/** A stored record: the server's own fields as the app reads them, plus a numeric id. */
export type Row = { id: number; [field: string]: unknown }

/** Every table the demo keeps. Each activity has its own database ("demo-restaurant", "demo-salon"...). */
export const TABLES = [
  "branches", "categories", "products", "customers", "suppliers", "expenses", "expenseItems", "employees", "roles",
  "treasuries", "units", "warehouses", "taxes", "exemptionReasons", "shifts", "posDevices",
] as const
export type TableName = (typeof TABLES)[number]

/** Settings are stored one row per server group (`generalTab`, `sales`...). */
export type SettingsRow = { group: string; value: Record<string, unknown> }

class DemoDb extends Dexie {
  settings!: Table<SettingsRow, string>
  meta!: Table<{ key: string; value: unknown }, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      ...Object.fromEntries(TABLES.map((t) => [t, "++id"])),
      settings: "group",
      meta: "key",
    })
  }

  table_(name: TableName): Table<Row, number> {
    return this.table(name)
  }
}

let db: DemoDb | null = null

export function openDb(activity: string) {
  db = new DemoDb(`demo-${activity}`)
  return db
}

export function getDb(): DemoDb {
  if (!db) throw new Error("demo database is not open")
  return db
}

export const table = (name: TableName) => getDb().table_(name)
