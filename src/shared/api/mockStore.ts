/**
 * In-memory stand-in for the backend. Each module's service.ts calls these helpers with the same
 * endpoint shapes as the real API, so swapping to HTTP later only touches service.ts files.
 */
const LATENCY = 250

export const delay = <T,>(value: T, ms = LATENCY) => new Promise<T>((r) => setTimeout(() => r(value), ms))

export class ApiError extends Error {}

export function createTable<T extends { id: number }>(seed: T[]) {
  let rows = [...seed]
  let nextId = Math.max(0, ...seed.map((r) => r.id)) + 1

  return {
    list: () => delay([...rows]),
    get: (id: number) => {
      const row = rows.find((r) => r.id === id)
      return row ? delay({ ...row }) : Promise.reject(new ApiError("not_found"))
    },
    /** Pass `id` to keep a document number sequence of its own (invoices); otherwise the next free id is used. */
    create: (data: Omit<T, "id"> & { id?: number }) => {
      const id = data.id ?? nextId
      nextId = Math.max(nextId, id + 1)
      const row = { ...data, id } as T
      rows = [row, ...rows]
      return delay(row)
    },
    update: (id: number, data: Partial<Omit<T, "id">>) => {
      rows = rows.map((r) => (r.id === id ? { ...r, ...data } : r))
      return delay(rows.find((r) => r.id === id)!)
    },
    remove: (id: number) => {
      rows = rows.filter((r) => r.id !== id)
      return delay(undefined)
    },
  }
}
