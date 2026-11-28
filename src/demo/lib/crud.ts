import { table, type Row, type TableName } from "../db"

export type ListOptions = {
  /** Text to look for (case-insensitive) in `searchIn`. */
  search?: string | null
  searchIn?: string[]
  /** A field name as the app sends it in SortBy (any casing). */
  sortBy?: string | null
  descending?: boolean
  where?: (row: Row) => boolean
}

const field = (row: Row, name: string) => {
  const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? row[key] : undefined
}

const compare = (a: unknown, b: unknown) => {
  if (a == null) return b == null ? 0 : 1
  if (b == null) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "ar")
}

export async function list(name: TableName, o: ListOptions = {}): Promise<Row[]> {
  let rows = await table(name).toArray()
  if (o.where) rows = rows.filter(o.where)
  const q = o.search?.trim().toLowerCase()
  if (q && o.searchIn?.length) rows = rows.filter((r) => o.searchIn!.some((f) => String(r[f] ?? "").toLowerCase().includes(q)))
  if (o.sortBy) {
    const by = o.sortBy
    rows.sort((a, b) => compare(field(a, by), field(b, by)) * (o.descending ? -1 : 1))
  }
  return rows
}

/** The server's page shape: `{ items, totalCount, pageNumber, pageSize }`. */
export function page<T>(rows: T[], pageNumber = 1, pageSize = 20) {
  const size = pageSize > 0 ? pageSize : 20
  const number = pageNumber > 0 ? pageNumber : 1
  return { items: rows.slice((number - 1) * size, number * size), totalCount: rows.length, pageNumber: number, pageSize: size }
}

export const get = (name: TableName, id: number) => table(name).get(id)

export async function create(name: TableName, data: Record<string, unknown>): Promise<Row> {
  const { id: _ignored, ...rest } = data
  const id = await table(name).add(rest as Row)
  return { ...rest, id } as Row
}

/** Merges `patch` into the stored record; undefined when there is none. */
export async function update(name: TableName, id: number, patch: Record<string, unknown>): Promise<Row | undefined> {
  const current = await table(name).get(id)
  if (!current) return undefined
  const next = { ...current, ...patch, id }
  await table(name).put(next)
  return next
}

export async function remove(name: TableName, id: number): Promise<boolean> {
  const current = await table(name).get(id)
  if (!current) return false
  await table(name).delete(id)
  return true
}
