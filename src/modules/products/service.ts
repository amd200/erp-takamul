import { activeBranchId, canManageAllBranches, useAuthStore } from "@/shared/auth/authStore"
import { http } from "@/shared/http/request"
import { fetchAllPages, toFormData, type PagedResult } from "@/shared/http/paged"
import type { ImportResultDto } from "./dto"
import { toBranchedForm, toDirectForm, toPreparedForm, toRawJson, typeOf } from "./mappers"
import type { Product, ProductInput, ProductQuery, ProductType } from "./types"

const PATH: Record<ProductType, string> = { Direct: "direct", Prepared: "prepared", Branched: "branched", RawMatrial: "raw-material" }

export const productsApi = {
  /** One page for the list screen; search, type and category are filtered on the server. */
  page: async (q: ProductQuery) => {
    return http<PagedResult<Product>>("/Products", {
      params: { Page: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined, Barcode: q.barcode || undefined, ProductType: q.productType, CategoryId: q.categoryId, SortBy: q.sortBy, SortDescending: q.sortBy ? q.sortDescending : undefined },
    })
  },

  /** The items a scanned barcode belongs to: the server matches it exactly, on the item or on one of its sale units (a few rows at most). */
  byBarcode: async (code: string) => (await productsApi.page({ page: 1, pageSize: 5, barcode: code })).items,

  /** Every item. Only the demo reports still need the whole catalog; screens search (`page`) or read by id (`get`). */
  list: () => fetchAllPages<Product>("/Products"),

  /** Full details from the kind's own endpoint. Without a known kind, the generic record tells it first. */
  get: async (id: number, knownType?: ProductType): Promise<Product> => {
    const type = knownType ?? typeOf((await http<Product>(`/Products/${id}`)).productType)
    const item = await http<Product>(`/Products/${PATH[type]}/${id}`)
    // The kind endpoints of direct and prepared items do not repeat the kind.
    return type === "Prepared" || type === "Direct" ? { ...item, productType: type } : item
  },

  save: (input: ProductInput, id: number | undefined) => {
    const editing = id != null
    const url = `/Products/${PATH[input.type]}${editing ? `/${id}` : ""}`
    const method = editing ? "PUT" : "POST"
    // A new item lands in the branch picked in its form (multi-branch users; the header's branch until they pick), others get their own.
    // The server lets the X-Branch-Id header beat the BranchId in the body, so the same branch goes out as the header too.
    const branchId = editing ? null : activeBranchId() ?? useAuthStore.getState().session?.branchId
    const headers = branchId && canManageAllBranches(useAuthStore.getState().session) ? { "X-Branch-Id": String(branchId) } : undefined
    switch (input.type) {
      case "RawMatrial": return http(url, { method, headers, data: toRawJson(input, branchId) })
      case "Branched": return http(url, { method, headers, data: toBranchedForm(input, { editing, branchId }) })
      case "Prepared": return http(url, { method, headers, data: toPreparedForm(input, { editing, branchId }) })
      default: return http(url, { method, headers, data: toDirectForm(input, { editing, branchId }) })
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
