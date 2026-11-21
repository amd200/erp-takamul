import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import type { CategoryDiscount, Currency, DeliveryCompany, DiningTable, ExemptionReason, PricingSystem, Tax } from "./types"

type Page<T> = { items: T[]; totalCount: number }

/** Every row of a paged list, walking the pages. */
async function allPages<T>(page: (params: Record<string, unknown>) => Promise<Page<T>>, sort?: ListSort): Promise<T[]> {
  const rows: T[] = []
  for (let n = 1; n < 200; n++) {
    const { items, totalCount } = await page({ Page: n, PageSize: 50, ...sort })
    rows.push(...items)
    if (!items.length || rows.length >= totalCount) break
  }
  return rows
}

/** /Taxes, /TaxExemptionReasons and /dining-tables answer a plain array. */
const plainList = <T,>(url: string) => (sort?: ListSort) => http<T[]>(url, { params: { ...sort } })
/** /PricingSystems and /CategoryDiscount answer the page `{ items, totalCount }` itself. */
const pagedList = <T,>(url: string) => (sort?: ListSort) => allPages<T>((params) => http<Page<T>>(url, { params }), sort)
/** /settings/currencies and /settings/delivery-companies answer `{ success, message, data: { items, totalCount } }`. */
const wrappedList = <T,>(url: string) => (sort?: ListSort) => allPages<T>((params) => http<{ data: Page<T> }>(url, { params }).then((r) => r.data), sort)

/** list/get/create/update/remove as the queries use them. */
function crud<T extends { id: number }, In>(url: string, list: (sort?: ListSort) => Promise<T[]>) {
  return {
    list,
    get: async (id: number) => (await list()).find((r) => r.id === id) as T,
    create: (data: In) => http<unknown>(url, { method: "POST", data }),
    update: (id: number, data: In) => http<unknown>(`${url}/${id}`, { method: "PUT", data }),
    remove: (id: number) => http<unknown>(`${url}/${id}`, { method: "DELETE" }),
  }
}

export const deliveryApi = crud<DeliveryCompany, { name: string }>("/settings/delivery-companies", wrappedList<DeliveryCompany>("/settings/delivery-companies"))

export const currenciesApi = {
  ...crud<Currency, Omit<Currency, "id">>("/settings/currencies", wrappedList<Currency>("/settings/currencies")),
  setDefault: (id: number) => http<unknown>(`/settings/currencies/${id}/set-default`, { method: "PATCH" }),
}

export const taxesListApi = crud<Tax, Omit<Tax, "id">>("/Taxes", plainList<Tax>("/Taxes"))
export const reasonsApi = crud<ExemptionReason, Omit<ExemptionReason, "id" | "isActive">>("/TaxExemptionReasons", plainList<ExemptionReason>("/TaxExemptionReasons"))
export const tablesApi = crud<DiningTable, { tableName: string }>("/dining-tables", plainList<DiningTable>("/dining-tables"))
export const pricingApi = crud<PricingSystem, Omit<PricingSystem, "id">>("/PricingSystems", pagedList<PricingSystem>("/PricingSystems"))

export const discountsApi = {
  ...crud<CategoryDiscount, { categoryId: number; discountValue: number; discountType: CategoryDiscount["discountType"] }>("/CategoryDiscount", pagedList<CategoryDiscount>("/CategoryDiscount")),
  // The server never deletes a discount; it switches it off.
  remove: (id: number) => http<unknown>(`/CategoryDiscount/${id}/DeactivateAsync`, { method: "PUT" }),
}
