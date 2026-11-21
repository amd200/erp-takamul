import { activeBranchId, canManageAllBranches, useAuthStore } from "@/shared/auth/authStore"
import { http } from "@/shared/http/request"
import { fetchAllPages, toFormData, type PagedResult } from "@/shared/http/paged"
import type { ImportResultDto } from "./dto"
import { calcToServer } from "./pricing"
import type { Product, ProductInput, ProductQuery, ProductType } from "./types"

/** Image: a new file is uploaded; on edit, keeping the old one sends its URL as ImageUrl. */
const imageFields = (image: ProductInput["image"], editing: boolean) =>
  image instanceof File ? { Image: image } : editing && typeof image === "string" && image ? { ImageUrl: image } : {}

/** An exempt item (it has an exemption reason) is sent as 1 = NotApplicable, otherwise 2 / 3. */
const taxFields = (p: ProductInput) => ({
  TaxId: p.taxId || undefined,
  TaxCalculation: p.taxExemptionReasonId ? 1 : calcToServer(p.taxCalculation),
  TaxExemptionReasonId: p.taxExemptionReasonId ?? undefined,
})

/** The form already holds the server's field names; multipart wants them PascalCase, so only the first letter changes. */
const pascal = (fields: Record<string, unknown>) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v]))
const pick = <K extends keyof ProductInput>(p: ProductInput, keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, p[k]]))

const COMMON = ["productNameAr", "productNameEn", "productNameUr", "description", "categoryId", "printerName", "displayOrder", "calories"] as const
const SELLING = ["barcode", "baseUnitId", "sellingPrice", "showInSalesScreen"] as const

type Ctx = { editing: boolean; branchId?: number | null }
const head = (p: ProductInput, { editing, branchId }: Ctx) => ({ ...(editing ? {} : { BranchId: branchId }), ...pascal(pick(p, COMMON)) })

export function toDirectForm(p: ProductInput, ctx: Ctx) {
  return toFormData({
    ...head(p, ctx), ...pascal(pick(p, [...SELLING, "costPrice", "minStockLevel"] as const)), ...taxFields(p), ...imageFields(p.image, ctx.editing),
    // Units travel as one JSON field; the server also accepts Units[0].UnitId style, but JSON is simpler.
    Units: JSON.stringify(p.units.map((u) => ({ ...(u.id ? { id: u.id } : {}), unitId: u.unitId, isBaseUnit: false, conversionFactor: u.conversionFactor, barcode: u.barcode, sellingPrice: u.sellingPrice }))),
  })
}

export function toPreparedForm(p: ProductInput, ctx: Ctx) {
  return toFormData({
    ...head(p, ctx), ...pascal(pick(p, SELLING)), ...taxFields(p), ...imageFields(p.image, ctx.editing),
    Components: JSON.stringify(p.components.map((c) => ({ componentProductId: c.componentProductId, unitId: c.unitId, quantity: c.quantity }))),
  })
}

export function toBranchedForm(p: ProductInput, ctx: Ctx) {
  return toFormData({ ...head(p, ctx), ChildrenIds: p.children.map((c) => c.id), ...imageFields(p.image, ctx.editing) })
}

export const toRawJson = (p: ProductInput, branchId?: number | null) => ({
  ...(branchId ? { branchId } : {}),
  ...pick(p, ["productNameAr", "costPrice", "purchaseUnitId", "conversionFactor", "displayOrder", "calories"] as const),
  productNameEn: p.productNameEn || null, productNameUr: p.productNameUr || null, baseUnitId: p.baseUnitId || null,
})

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
    const type = knownType ?? (await http<Product>(`/Products/${id}`)).productType ?? "Direct"
    const item = await http<Product>(`/Products/${PATH[type]}/${id}`)
    // The kind endpoints of direct and prepared items do not repeat the kind.
    return type === "Prepared" || type === "Direct" ? { ...item, productType: type } : item
  },

  save: (input: ProductInput, id: number | undefined) => {
    const editing = id != null
    const url = `/Products/${PATH[input.productType]}${editing ? `/${id}` : ""}`
    const method = editing ? "PUT" : "POST"
    // A new item lands in the branch picked in its form (multi-branch users; the header's branch until they pick), others get their own.
    // The server lets the X-Branch-Id header beat the BranchId in the body, so the same branch goes out as the header too.
    const branchId = editing ? null : activeBranchId() ?? useAuthStore.getState().session?.branchId
    const headers = branchId && canManageAllBranches(useAuthStore.getState().session) ? { "X-Branch-Id": String(branchId) } : undefined
    switch (input.productType) {
      case "RawMatrial": return http(url, { method, headers, data: toRawJson(input, branchId) })
      case "Branched": return http(url, { method, headers, data: toBranchedForm(input, { editing, branchId }) })
      case "Prepared": return http(url, { method, headers, data: toPreparedForm(input, { editing, branchId }) })
      default: return http(url, { method, headers, data: toDirectForm(input, { editing, branchId }) })
    }
  },

  /** Cost of a recipe from the server, which converts each material's unit to its cost. */
  preparedCost: async (components: { componentProductId: number; unitId: number; quantity: number }[]) =>
    (await http<{ totalCost: number }>("/Products/calculate-prepared-cost", {
      method: "POST", data: components.map((c) => ({ componentProductId: c.componentProductId, unitId: c.unitId, quantity: c.quantity })),
    })).totalCost,

  remove: (id: number) => http<{ message: string }>(`/Products/${id}`, { method: "DELETE" }),

  importExcel: async (file: File) => (await http<{ message: string; data: ImportResultDto }>("/ProductImport/import-excel", { method: "POST", data: toFormData({ file }) })),

  template: () => http<Blob>("/ProductImport/template", { responseType: "blob" }),

  /** Not on the server: stock moves through adjustments there. Kept so the adjustments mock still compiles. */
  setBalance: async (_id: number, _balance: number) => undefined,
}
