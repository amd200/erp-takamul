import { useQuery } from "@tanstack/react-query"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { branchesApi } from "@/modules/branches/service"
import { customersApi } from "@/modules/customers/service"
import { suppliersApi } from "@/modules/suppliers/service"
import { treasuriesApi } from "@/modules/treasuries/service"
import type { Warehouse } from "@/modules/warehouses/types"
import type { CustomerSeed, EmployeeDto, NamedSeed, SupplierSeed } from "./types"

const toCustomerSeed = (c: { id: number; name: string; phone: string; taxNumber: string; balance: number }): CustomerSeed => ({ id: c.id, name: c.name, phone: c.phone, taxNumber: c.taxNumber || null, balance: c.balance })

const WAREHOUSES: NamedSeed[] = [{ id: 1, name: "المخزن الرئيسي" }, { id: 2, name: "مخزن الفرع" }]
const EMPLOYEES: NamedSeed[] = [{ id: 1, name: "أحمد محمد" }, { id: 2, name: "سارة إبراهيم" }, { id: 3, name: "محمود السيد" }]

export const useCustomers = () => useQuery({ queryKey: ["customers", "refs"], queryFn: async () => (await customersApi.list()).filter((c) => c.isActive !== false) })
export const useSuppliers = () => useQuery({ queryKey: ["suppliers", "refs"], queryFn: async () => (await suppliersApi.list()).filter((s) => s.isActive !== false) })
export const useTreasuries = () => useQuery({ queryKey: ["treasuries", "refs"], queryFn: () => treasuriesApi.list() })
export const useEmployees = () => useQuery({
  queryKey: ["employees", "refs"],
  queryFn: () => fetchAllPages<EmployeeDto>("/employees"),
  staleTime: 5 * 60_000,
})
/** Warehouses come back as a bare list (or wrapped as `data`), one row per warehouse. */
export const useWarehouses = () => useQuery({
  queryKey: ["warehouses", "refs"],
  queryFn: async () => {
    const res = await http<Warehouse[] | { data?: Warehouse[] }>("/Warehouse")
    return (Array.isArray(res) ? res : res?.data ?? []).filter((w) => w.isActive !== false)
  },
  staleTime: 5 * 60_000,
})
export const useBranches = () => useQuery({ queryKey: ["branches", "refs"], queryFn: branchesApi.list, staleTime: 5 * 60_000 })

/** Synchronous seeds for mock code that needs names without a request (sales numbering, report data). */
export const lookupData = {
  CUSTOMERS: [
    { id: 1, name: "عميل نقدي", phone: "", taxNumber: "", balance: 0 },
    { id: 2, name: "شركة النور للتوريدات", phone: "0551234567", taxNumber: "310123456700003", balance: 18300 },
    { id: 3, name: "مخبز الأمل", phone: "0569876543", taxNumber: "310987654300003", balance: 7640 },
    { id: 4, name: "محمود السيد", phone: "0501112233", taxNumber: "", balance: 0 },
    { id: 5, name: "سارة إبراهيم", phone: "0543334455", taxNumber: "", balance: -250 },
    { id: 6, name: "Gulf Trading LLC", phone: "0097145550000", taxNumber: "", balance: 0 },
  ].map(toCustomerSeed),
  SUPPLIERS: [
    { id: 1, name: "شركة الوفرة للمواد الغذائية", phone: "0112345678" },
    { id: 2, name: "مؤسسة النخبة للتوزيع", phone: "0126543210" },
    { id: 3, name: "مصنع الصفا للمنظفات", phone: "0138887766" },
  ] as SupplierSeed[],
  TREASURIES: [{ id: 1, name: "الخزينة الرئيسية" }, { id: 2, name: "بنك الراجحي" }, { id: 3, name: "شبكة مدى" }] as NamedSeed[],
  WAREHOUSES, EMPLOYEES,
}

/** The treasury a new payment starts on: the one chosen in Settings (default sales / purchases treasury) when it is in `list`, else the first. */
export const pickTreasury = <T extends { id: number }>(list: T[], preferred: unknown) => list.find((x) => x.id === Number(preferred)) ?? list[0]
