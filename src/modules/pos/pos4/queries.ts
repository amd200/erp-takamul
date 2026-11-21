import { useMemo } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { showsInSales } from "@/modules/products/pricing"
import { productsApi } from "@/modules/products/service"
import type { Product } from "@/modules/products/types"
import { pos4Api } from "./service"
import { pos4Keys } from "./keys"

const PAGE = 100

export const usePublicBranch = () => useQuery({ queryKey: pos4Keys.branch, queryFn: pos4Api.branch, staleTime: 30 * 60_000 })
export const usePos4Categories = () => useQuery({ queryKey: pos4Keys.categories, queryFn: pos4Api.categories, staleTime: 60_000 })

/** An item filed under a branched item: it is sold through its parent, not as a card of its own. */
export const isBranchChild = (p: Product) => !!p.parentProductId && (p.productType === "Direct" || p.productType === "Prepared")

type Page = { items: Product[]; more: boolean }

/**
 * The cards of one category (or of a search), one server page at a time; `loadMore` asks for the next.
 * The server filters by `CategoryId` and `SearchTerm` (a name, or a barcode), so the whole menu is never loaded.
 */
export function usePos4Items({ categoryId, term, enabled = true }: { categoryId: number | null; term: string; enabled?: boolean }) {
  const q = useInfiniteQuery({
    queryKey: [...pos4Keys.items, term, categoryId] as const,
    enabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<Page> => {
      const p = await productsApi.page({ page: pageParam, pageSize: PAGE, searchTerm: term || undefined, categoryId: categoryId ?? undefined })
      return { items: p.items, more: p.totalCount > pageParam * PAGE }
    },
    getNextPageParam: (last, _all, lastParam) => (last.more ? lastParam + 1 : undefined),
    staleTime: 60_000,
  })
  const items = useMemo(() => {
    const seen = new Set<number>()
    return (q.data?.pages ?? []).flatMap((p) => p.items).filter((p) => showsInSales(p) && p.productType !== "RawMatrial" && !isBranchChild(p) && !seen.has(p.id) && !!seen.add(p.id))
  }, [q.data])
  return {
    items,
    loading: q.isLoading,
    error: q.isError,
    hasMore: !!q.hasNextPage,
    loadingMore: q.isFetchingNextPage,
    loadMore: () => { void q.fetchNextPage() },
    retry: () => { void q.refetch() },
  }
}

export const useBranchedItems = (id: number | null) => useQuery({ queryKey: pos4Keys.branched(id), queryFn: () => pos4Api.branched(id!), enabled: id != null, staleTime: 60_000 })
