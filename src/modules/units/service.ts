import { useAuthStore } from "@/shared/auth/authStore"
import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import type { Unit, UnitInput } from "./types"

const body = (u: UnitInput) => ({ name: u.name, description: u.description || null, taxCode: u.taxCode || null })

// The server caps PageSize at 50 and names the page param PageNumber.
export const unitsApi = {
  list: (sort?: ListSort) => fetchAllPages<Unit>("/UnitOfMeasure", { pageSize: 50, pageParam: "PageNumber", params: { ...sort } }),
  get: (id: number) => http<Unit>(`/UnitOfMeasure/${id}`),
  create: (data: UnitInput) => http<{ message: string }>("/UnitOfMeasure", { method: "POST", data: { ...body(data), branchId: useAuthStore.getState().session?.branchId ?? null } }),
  update: (id: number, data: UnitInput) => http<{ message: string }>("/UnitOfMeasure", { method: "PUT", params: { id }, data: body(data) }),
  remove: (id: number) => http(`/UnitOfMeasure/${id}`, { method: "DELETE" }),
}
