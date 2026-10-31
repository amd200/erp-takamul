import { useAuthStore } from "@/shared/auth/authStore"
import { http } from "@/shared/http/request"
import { fetchAllPages, toFormData, type PagedResult } from "@/shared/http/paged"
import type { ImportResultDto } from "./dto"
import { toBranchedForm, toDirectForm, toPreparedForm, toRawJson, typeOf } from "./mappers"
import type { Product, ProductInput, ProductQuery, ProductType, SaveOptions } from "./types"

const PATH: Record<ProductType, string> = { Direct: "direct", Prepared: "prepared", Branched: "branched", RawMatrial: "raw-material" }

export const productsApi = {
  /** One page for the list screen; search, type and category are filtered on the server. */
  page: async (q: ProductQuery) => {
    const res = await http<PagedResult<Product>>("/Products", {
      params: { Page: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined, Barcode: q.barcode || undefined, ProductType: q.productType, CategoryId: q.categoryId, SortBy: q.sortBy, SortDescending: q.sortBy ? q.sortDescending : undefined },
    })
    return { items: res.items, total: res.totalCount }
  },

  /** Every item. Only the demo reports still need the whole catalog; screens search (`page`) or read by id (`get`). */
  list: () => fetchAllPages<Product>("/Products"),

  /** Full details from the kind's own endpoint. Without a known kind, the generic record tells it first. */
  get: async (id: number, knownType?: ProductType): Promise<Product> => {
    const type = knownType ?? typeOf((await http<Product>(`/Products/${id}`)).productType)
    const item = await http<Product>(`/Products/${PATH[type]}/${id}`)
    // The kind endpoints of direct and prepared items do not repeat the kind.
    return type === "Prepared" || type === "Direct" ? { ...item, productType: type } : item
  },

  save: (input: ProductInput, id: number | undefined, { exempt }: SaveOptions) => {
    const editing = id != null
    const url = `/Products/${PATH[input.type]}${editing ? `/${id}` : ""}`
    const method = editing ? "PUT" : "POST"
    // A new item lands in the branch picked in the header (multi-branch users); others get their own.
    const branchId = editing ? null : useAuthStore.getState().session?.branchId
    switch (input.type) {
      case "RawMatrial": return http(url, { method, data: toRawJson(input, branchId) })
      case "Branched": return http(url, { method, data: toBranchedForm(input, { editing, branchId }) })
      case "Prepared": return http(url, { method, data: toPreparedForm(input, { editing, exempt, branchId }) })
      default: return http(url, { method, data: toDirectForm(input, { editing, exempt, branchId }) })
    }
  },

  /** Cost of a recipe from the server, which converts each material's unit to its cost. */
  preparedCost: async (components: { productId: number; unitId: number; quantity: number }[]) =>
    (await http<{ totalCost: number }>("/Products/calculate-prepared-cost", {
      method: "POST", data: components.map((c) => ({ componentProductId: c.productId, unitId: c.unitId, quantity: c.quantity })),
    })).totalCost,

  remove: (id: number) => http<{ message: string }>(`/Products/${id}`, { method: "DELETE" }),

  importExcel: async (file: File) => (await http<{ message: string; data: ImportResultDto }>("/ProductImport/import-excel", { method: "POST", data: toFormData({ file }) })),

  template: () => http<Blob>("/ProductImport/template", { responseType: "blob" }),

  /** Not on the server: stock moves through adjustments there. Kept so the adjustments mock still compiles. */
  setBalance: async (_id: number, _balance: number) => undefined,
}
