import { http } from "./request"

/** The server's page shape. */
export type PagedResult<T> = { items: T[]; totalCount: number; pageNumber?: number; pageSize?: number }

export type PageParams = { page: number; pageSize: number; searchTerm?: string; [k: string]: unknown }


export async function fetchAllPages<T>(url: string, { pageSize = 100, pageParam = "Page", sizeParam = "PageSize", params = {} as Record<string, unknown> } = {}) {
  const all: T[] = []
  for (let page = 1; page < 500; page++) {
    const res = await http<PagedResult<T>>(url, { params: { ...params, [pageParam]: page, [sizeParam]: pageSize } })
    all.push(...(res.items ?? []))
    if (!res.items?.length || all.length >= (res.totalCount ?? 0)) break
  }
  return all
}

export function toFormData(fields: Record<string, unknown>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, String(v)))
    else if (value instanceof Blob) fd.append(key, value)
    else fd.append(key, String(value))
  }
  return fd
}
