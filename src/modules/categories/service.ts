import { useAuthStore } from "@/shared/auth/authStore"
import { http } from "@/shared/http/request"
import { fetchAllPages, toFormData, type PagedResult } from "@/shared/http/paged"
import type { Category, CategoryInput, CategoryQuery } from "./types"

const form = (c: CategoryInput, extra: Record<string, unknown> = {}) => toFormData({
  ...extra, CategoryNameAr: c.categoryNameAr, CategoryNameEn: c.categoryNameEn, Description: c.description, ParentCategoryId: c.parentCategoryId, DisplayOrder: c.displayOrder,
})

/** Applies the printer to the category's items; nothing to do when none was picked. */
const applyPrinter = (categoryId: number, printerName: string | null) =>
  printerName ? http("/Products/update-category-printer", { method: "PUT", data: { categoryId, printerName } }) : Promise.resolve()

export const categoriesApi = {
  page: (q: CategoryQuery) =>
    http<PagedResult<Category>>("/ProductCategories", { params: { PageNumber: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined } }),
  list: () => fetchAllPages<Category>("/ProductCategories", { pageParam: "PageNumber" }),
  get: async (id: number) => {
    const all = await categoriesApi.list()
    const c = all.find((x) => x.id === id)
    if (!c) throw new Error("not_found")
    return c
  },
  create: async (data: CategoryInput) => {
    const res = await http<{ message: string }>("/ProductCategories/create", { method: "POST", data: form(data, { BranchId: useAuthStore.getState().session?.branchId }) })
    // The create call doesn't return the new id, so a printer can only be applied when editing.
    return res
  },
  update: async (id: number, data: CategoryInput) => {
    const res = await http<{ message: string }>(`/ProductCategories/${id}`, { method: "PUT", data: form(data, { Id: id }) })
    await applyPrinter(id, data.printerName)
    return res
  },
  remove: (id: number) => http<{ message: string }>(`/ProductCategories/${id}`, { method: "DELETE" }),
}
