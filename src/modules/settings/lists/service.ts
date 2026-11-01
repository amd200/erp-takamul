import type { ListSort } from "@/shared/api/crudQueries"
import { http } from "@/shared/http/request"
import type { CategoryDiscount, Currency, DeliveryCompany, DiningTable, ExemptionReason, PricingSystem, Tax } from "./types"

/** The server sends either the bare list, a page `{ items }`, or either of them wrapped in `{ data }`. */
function itemsOf<T>(res: unknown): { items: T[]; total: number } {
  const body = res as { data?: unknown } | null
  const inner = (body && !Array.isArray(body) && body.data !== undefined ? body.data : res) as { items?: T[]; totalCount?: number } | T[] | null
  const items = Array.isArray(inner) ? inner : inner?.items ?? []
  return { items, total: Array.isArray(inner) ? items.length : inner?.totalCount ?? items.length }
}

/** Every row of a list, walking the pages when the endpoint pages. */
async function all<T>(url: string, paged: boolean, sort?: ListSort): Promise<T[]> {
  if (!paged) return itemsOf<T>(await http<unknown>(url, { params: { ...sort } })).items
  const rows: T[] = []
  for (let page = 1; page < 200; page++) {
    const { items, total } = itemsOf<T>(await http<unknown>(url, { params: { Page: page, PageSize: 50, ...sort } }))
    rows.push(...items)
    if (!items.length || rows.length >= total) break
  }
  return rows
}

/** list/get/create/update/remove for a plain endpoint, the shape `createCrudQueries` expects. */
function crud<T extends { id: number }, In>(url: string, paged = false) {
  const list = (sort?: ListSort) => all<T>(url, paged, sort)
  return {
    list,
    get: async (id: number) => (await list()).find((r) => r.id === id) as T,
    create: (data: In) => http<unknown>(url, { method: "POST", data }),
    update: (id: number, data: In) => http<unknown>(`${url}/${id}`, { method: "PUT", data }),
    remove: (id: number) => http<unknown>(`${url}/${id}`, { method: "DELETE" }),
  }
}

export const deliveryApi = crud<DeliveryCompany, { name: string }>("/settings/delivery-companies", true)

export const currenciesApi = {
  ...crud<Currency, Omit<Currency, "id">>("/settings/currencies", true),
  setDefault: (id: number) => http<unknown>(`/settings/currencies/${id}/set-default`, { method: "PATCH" }),
}

export const taxesListApi = crud<Tax, Omit<Tax, "id">>("/Taxes")
export const reasonsApi = crud<ExemptionReason, Omit<ExemptionReason, "id" | "isActive">>("/TaxExemptionReasons")
export const tablesApi = crud<DiningTable, { tableName: string }>("/dining-tables")
export const pricingApi = crud<PricingSystem, Omit<PricingSystem, "id">>("/PricingSystems", true)

export const discountsApi = {
  ...crud<CategoryDiscount, { categoryId: number; discountValue: number; discountType: CategoryDiscount["discountType"] }>("/CategoryDiscount", true),
  // The server never deletes a discount; it switches it off.
  remove: (id: number) => http<unknown>(`/CategoryDiscount/${id}/DeactivateAsync`, { method: "PUT" }),
}
