import type { ListSort } from "@/shared/api/crudQueries"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { currentBranchId, partyToBody } from "@/modules/partners/mappers"
import type { Supplier, SupplierInput } from "./types"

const body = (s: SupplierInput) => ({ supplierName: s.name, email: s.email.trim() || null, paymentTerms: s.paymentTerms, ...partyToBody(s) })

export const suppliersApi = {
  list: (sort?: ListSort) => fetchAllPages<Supplier>("/Suppliers", { pageSize: 100, params: { ...sort } }),
  get: (id: number) => http<Supplier>(`/Suppliers/${id}`),
  create: (data: SupplierInput) => http<unknown>("/Suppliers", { method: "POST", data: { ...body(data), branchId: currentBranchId() } }),
  // The update body repeats the id even though the path has it.
  update: (id: number, data: SupplierInput) => http<unknown>(`/Suppliers/${id}`, { method: "PUT", data: { id, ...body(data) } }),
  remove: (id: number) => http<unknown>(`/Suppliers/${id}`, { method: "DELETE" }),
}
