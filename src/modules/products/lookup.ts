import { useEffect, useState } from "react"
import { keepPreviousData, useQueries, useQuery, type QueryClient } from "@tanstack/react-query"
import { productKeys } from "./queries"
import { productsApi } from "./service"
import type { Product, ProductType } from "./types"

/**
 * Finding items without loading the whole catalog. The server filters (`SearchTerm`, `ProductType`) and returns one
 * small page; items already chosen are read one by one by id. Every picker and sales screen goes through here.
 */

/** Rows asked for a typed name. */
export const SEARCH_SIZE = 30
/** Rows asked for a scanned code: the server's match may be loose, so the exact one is picked from a bigger page. */
const CODE_SIZE = 100
const DEBOUNCE_MS = 250

type SearchOptions = { type?: ProductType; size?: number }

const searchKey = (term: string, type: ProductType | undefined, size: number) => [...productKeys.all, "search", term, type ?? null, size] as const
const searchItems = async (term: string, type: ProductType | undefined, size: number) =>
  (await productsApi.page({ page: 1, pageSize: size, searchTerm: term || undefined, productType: type })).items

/** A value that follows `value` after it has stopped changing for a moment, so typing does not ask the server per key. */
export function useDebounced<T>(value: T, ms = DEBOUNCE_MS) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return settled
}

/** The first page of items matching what is typed; an empty term lists the first page. Keeps the old list while the next loads. */
export function useProductSearch(term: string, { type, size = SEARCH_SIZE, enabled = true }: SearchOptions & { enabled?: boolean } = {}) {
  const settled = useDebounced(term.trim())
  return useQuery({
    queryKey: searchKey(settled, type, size),
    queryFn: () => searchItems(settled, type, size),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

/** Items matching a typed or scanned code, read now (not from a component), cached for a minute. */
export const searchProducts = (qc: QueryClient, term: string, { type, size = CODE_SIZE }: SearchOptions = {}) =>
  qc.fetchQuery({ queryKey: searchKey(term, type, size), queryFn: () => searchItems(term, type, size), staleTime: 60_000 })

/**
 * The item a scanned barcode belongs to. The server matches it exactly, on the item or on one of its sale units
 * (`Barcode` param of GET /Products); `unit` is that sale unit, or null when it is the item's own barcode.
 */
export async function findByBarcode(qc: QueryClient, code: string, accept: (p: Product) => boolean = () => true) {
  const items = await qc.fetchQuery({
    queryKey: [...productKeys.all, "barcode", code] as const,
    queryFn: async () => (await productsApi.page({ page: 1, pageSize: 5, barcode: code })).items,
    staleTime: 30_000,
  })
  const product = items.find(accept)
  if (!product) return null
  return { product, unit: product.barcode === code ? null : (product.units ?? []).find((u) => u.barcode === code) ?? null }
}

const byIdKey = (id: number) => [...productKeys.all, "by-id", id] as const

/** Keeps an item that was just found, so reading it by id later needs no request. */
export const rememberProduct = (qc: QueryClient, p: Product) => qc.setQueryData(byIdKey(p.id), p)

/** One item, from the cache when it was found before, else from the server. */
export const fetchProduct = (qc: QueryClient, id: number) => qc.fetchQuery({ queryKey: byIdKey(id), queryFn: () => productsApi.get(id), staleTime: 5 * 60_000 })

/** The items with these ids (an invoice's lines, a recipe's materials), as a map; ones still loading are missing from it. */
export function useProductsByIds(ids: number[], enabled = true) {
  return useQueries({
    queries: (enabled ? [...new Set(ids)] : []).map((id) => ({ queryKey: byIdKey(id), queryFn: () => productsApi.get(id), staleTime: 5 * 60_000 })),
    // A new Map only when some item arrives, so a screen can depend on it.
    combine: (results) => {
      const map = new Map<number, Product>()
      for (const r of results) if (r.data) map.set(r.data.id, r.data)
      return { map, isLoading: results.some((r) => r.isLoading) }
    },
  })
}

/** How many items there are, from the total of a one-row page. */
export const countProducts = async () => (await productsApi.page({ page: 1, pageSize: 1 })).total
