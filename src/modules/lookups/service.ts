import { useQuery } from "@tanstack/react-query"
import { fetchAllPages } from "@/shared/http/paged"
import { branchesApi } from "@/modules/branches/service"
import { customersApi } from "@/modules/customers/service"
import { suppliersApi } from "@/modules/suppliers/service"
import { warehousesApi } from "@/modules/warehouses/service"
import type { EmployeeDto } from "./types"
import { customerKeys } from "@/modules/customers/keys"
import { supplierKeys } from "@/modules/suppliers/keys"
import { employeeKeys } from "@/modules/employees/keys"
import { warehouseKeys } from "@/modules/warehouses/keys"
import { branchKeys } from "@/modules/branches/keys"

export const useCustomers = () => useQuery({ queryKey: customerKeys.refs, queryFn: () => customersApi.list() })
export const useSuppliers = () => useQuery({ queryKey: supplierKeys.refs, queryFn: () => suppliersApi.list() })
export const useEmployees = (enabled = true) => useQuery({
  queryKey: employeeKeys.refs,
  queryFn: () => fetchAllPages<EmployeeDto>("/employees"),
  enabled,
  staleTime: 5 * 60_000,
})
/** `GET /Warehouse` returns a plain array. */
export const useWarehouses = () => useQuery({
  queryKey: warehouseKeys.refs,
  queryFn: () => warehousesApi.list(),
  staleTime: 5 * 60_000,
})
export const useBranches = () => useQuery({ queryKey: branchKeys.refs, queryFn: branchesApi.list, staleTime: 5 * 60_000 })

/** The treasury a new payment starts on: the one chosen in Settings (default sales / purchases treasury) when it is in `list`, else the first. */
export const pickTreasury = <T extends { id: number }>(list: T[], preferred: unknown) => list.find((x) => x.id === Number(preferred)) ?? list[0]
