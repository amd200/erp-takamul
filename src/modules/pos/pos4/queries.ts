import { useQuery } from "@tanstack/react-query"
import { productsApi } from "@/modules/products/service"
import { pos4Api } from "./service"

export const pos4Keys = { branch: ["pos4", "branch"] as const, categories: ["pos4", "categories"] as const, products: ["pos4", "products"] as const, branched: (id: number | null) => ["pos4", "branched", id] as const }

export const usePublicBranch = () => useQuery({ queryKey: pos4Keys.branch, queryFn: pos4Api.branch, staleTime: 30 * 60_000 })
export const usePos4Categories = () => useQuery({ queryKey: pos4Keys.categories, queryFn: pos4Api.categories, staleTime: 60_000 })
/** The whole menu at once: the phone layout lists every category's items on one scrolling page. */
export const usePos4Products = () => useQuery({ queryKey: pos4Keys.products, queryFn: productsApi.list, staleTime: 60_000 })
export const useBranchedItems = (id: number | null) => useQuery({ queryKey: pos4Keys.branched(id), queryFn: () => pos4Api.branched(id!), enabled: id != null, staleTime: 60_000 })
