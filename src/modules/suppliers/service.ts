import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import type { OpeningBalanceForm } from "@/modules/partners/schema"
import type { SupplierForm } from "./schema"
import type { Supplier } from "./types"

export const suppliersApi = {
  list: (sort?: ListSort) => fetchAllPages<Supplier>("/Suppliers", { pageSize: 100, params: { ...sort } }),
  get: (id: number) => http<Supplier>(`/Suppliers/${id}`),
  create: (data: SupplierForm) => http<unknown>("/Suppliers", { method: "POST", data: { ...data, branchId: currentBranchId() } }),
  // The update body repeats the id even though the path has it.
  update: (id: number, data: SupplierForm) => http<unknown>(`/Suppliers/${id}`, { method: "PUT", data: { id, ...data } }),
  /** The server has no opening-balance endpoint: PUT /Suppliers/{id} replaces the whole record, so the current one is read first and sent back with only these three fields changed. */
  setOpeningBalance: async (id: number, values: OpeningBalanceForm) => {
    const current = await http<Supplier>(`/Suppliers/${id}`)
    return http<unknown>(`/Suppliers/${id}`, { method: "PUT", data: { ...current, id, ...values } })
  },
  remove: (id: number) => http<unknown>(`/Suppliers/${id}`, { method: "DELETE" }),
}
