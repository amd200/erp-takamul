import { fetchAllPages, type PagedResult } from "@/shared/http/paged"
import type { ListSort } from "@/shared/api/crudQueries"
import { http } from "@/shared/http/request"
import type { Addition, AdditionInput, AdditionQuery } from "./types"

const body = (a: AdditionInput) => ({ additionNameAr: a.nameAr, additionNameEn: a.nameEn || null, categoryIds: a.categoryIds })

export const additionsApi = {
  page: (q: AdditionQuery) => {
    return http<PagedResult<Addition>>("/Additions", { params: { Page: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined, SortBy: q.sortBy, SortDescending: q.sortBy ? q.sortDescending : undefined } })
  },
  list: (sort?: ListSort) => fetchAllPages<Addition>("/Additions", { params: { ...sort } }),
  get: (id: number) => http<Addition>(`/Additions/${id}`),
  create: (data: AdditionInput) => http<{ message: string }>("/Additions", { method: "POST", data: body(data) }),
  update: (id: number, data: AdditionInput) => http<{ message: string }>(`/Additions/${id}`, { method: "PUT", data: body(data) }),
  remove: (id: number) => http(`/Additions/${id}`, { method: "DELETE" }),
}
