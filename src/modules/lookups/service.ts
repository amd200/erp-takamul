import { useQuery } from "@tanstack/react-query"
import { fetchAllPages } from "@/shared/http/paged"
import { branchesApi } from "@/modules/branches/service"
import { customersApi } from "@/modules/customers/service"
import { suppliersApi } from "@/modules/suppliers/service"
import { treasuriesApi } from "@/modules/treasuries/service"
import type { Warehouse } from "@/modules/warehouses/types"
import type { EmployeeDto } from "./types"

export const useCustomers = () => useQuery({ queryKey: ["customers", "refs"], queryFn: async () => (await customersApi.list()).filter((c) => c.isActive !== false) })
export const useSuppliers = () => useQuery({ queryKey: ["suppliers", "refs"], queryFn: async () => (await suppliersApi.list()).filter((s) => s.isActive !== false) })
export const useTreasuries = () => useQuery({ queryKey: ["treasuries", "refs"], queryFn: () => treasuriesApi.list() })
export const useEmployees = () => useQuery({
  queryKey: ["employees", "refs"],
  queryFn: () => fetchAllPages<EmployeeDto>("/employees"),
  staleTime: 5 * 60_000,
})
/** `GET /Warehouse` is paged (`{ items, totalCount, pageNumber, pageSize }`), so every page is read. */
export const useWarehouses = () => useQuery({
  queryKey: ["warehouses", "refs"],
  queryFn: () => fetchAllPages<Warehouse>("/Warehouse"),
  staleTime: 5 * 60_000,
})
export const useBranches = () => useQuery({ queryKey: ["branches", "refs"], queryFn: branchesApi.list, staleTime: 5 * 60_000 })

/** The treasury a new payment starts on: the one chosen in Settings (default sales / purchases treasury) when it is in `list`, else the first. */
export const pickTreasury = <T extends { id: number }>(list: T[], preferred: unknown) => list.find((x) => x.id === Number(preferred)) ?? list[0]
