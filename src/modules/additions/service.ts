import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import type { Addition, AdditionInput } from "./types"

const body = (a: AdditionInput) => ({ additionNameAr: a.nameAr, additionNameEn: a.nameEn || null, additionNameUr: a.nameUr || null, categoryIds: a.categoryIds })

export const additionsApi = {
  list: (sort?: ListSort) => http<Addition[]>("/Additions", { params: { ...sort } }),
  get: (id: number) => http<Addition>(`/Additions/${id}`),
  create: (data: AdditionInput) => http<{ message: string }>("/Additions", { method: "POST", data: body(data) }),
  update: (id: number, data: AdditionInput) => http<{ message: string }>(`/Additions/${id}`, { method: "PUT", data: body(data) }),
  remove: (id: number) => http(`/Additions/${id}`, { method: "DELETE" }),
}
