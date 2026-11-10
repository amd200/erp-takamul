import type { ProductQuery, ProductType } from "./types"

export const productKeys = {
  all: ["products"] as const,
  page: (q: ProductQuery) => ["products", "page", q] as const,
  detail: (id: number, type?: ProductType) => ["products", "detail", id, type ?? null] as const,
  search: (term: string, type: ProductType | undefined, size: number) => ["products", "search", term, type ?? null, size] as const,
  byId: (id: number) => ["products", "by-id", id] as const,
  posGrid: (term: string, categoryId: number | null | undefined) => ["products", "pos-grid", term, categoryId ?? undefined] as const,
  preparedCost: (components: unknown) => ["products", "prepared-cost", components] as const,
}
