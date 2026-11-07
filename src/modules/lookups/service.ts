import { useQuery } from "@tanstack/react-query"
import { fetchAllPages } from "@/shared/http/paged"
import { branchesApi } from "@/modules/branches/service"
import { customersApi } from "@/modules/customers/service"
import { suppliersApi } from "@/modules/suppliers/service"
import { treasuriesApi } from "@/modules/treasuries/service"
import { warehousesApi } from "@/modules/warehouses/service"
import type { EmployeeDto } from "./types"

export const useCustomers = () => useQuery({ queryKey: ["customers", "refs"], queryFn: async () => (await customersApi.list()).filter((c) => c.isActive !== false) })
export const useSuppliers = () => useQuery({ queryKey: ["suppliers", "refs"], queryFn: async () => (await suppliersApi.list()).filter((s) => s.isActive !== false) })
export const useTreasuries = () => useQuery({ queryKey: ["treasuries", "refs"], queryFn: () => treasuriesApi.list() })
export const useEmployees = (enabled = true) => useQuery({
  queryKey: ["employees", "refs"],
  queryFn: () => fetchAllPages<EmployeeDto>("/employees"),
  enabled,
  staleTime: 5 * 60_000,
})
/** `GET /Warehouse` returns a plain array. */
export const useWarehouses = () => useQuery({
  queryKey: ["warehouses", "refs"],
  queryFn: () => warehousesApi.list(),
  staleTime: 5 * 60_000,
})
export const useBranches = () => useQuery({ queryKey: ["branches", "refs"], queryFn: branchesApi.list, staleTime: 5 * 60_000 })

/** The treasury a new payment starts on: the one chosen in Settings (default sales / purchases treasury) when it is in `list`, else the first. */
export const pickTreasury = <T extends { id: number }>(list: T[], preferred: unknown) => list.find((x) => x.id === Number(preferred)) ?? list[0]
