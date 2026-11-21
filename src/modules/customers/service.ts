import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import type { CustomerForm, OpeningBalanceForm } from "./schema"
import type { Customer } from "./types"

export const customersApi = {
  list: (sort?: ListSort) => fetchAllPages<Customer>("/Customer", { pageSize: 100, params: { ...sort } }),
  get: (id: number) => http<Customer>(`/Customer/${id}`),
  create: (data: CustomerForm) => http<unknown>("/Customer", { method: "POST", data: { ...data, branchId: currentBranchId() } }),
  update: (id: number, data: CustomerForm) => http<unknown>(`/Customer/${id}`, { method: "PUT", data }),
  /**
   * The server has no opening-balance endpoint: PUT /Customer/{id} replaces the whole record, so the current one is read first and sent back
   * with only these three fields changed. Companions are left out (the server leaves them alone when the list is missing).
   */
  setOpeningBalance: async (id: number, values: OpeningBalanceForm) => {
    const { companions: _companions, ...current } = await http<Customer>(`/Customer/${id}`)
    return http<unknown>(`/Customer/${id}`, { method: "PUT", data: { ...current, ...values } })
  },
  remove: (id: number) => http<unknown>(`/Customer/${id}`, { method: "DELETE" }),
}
