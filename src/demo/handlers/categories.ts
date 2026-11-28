import { http, HttpResponse } from "msw"
import type { Row } from "../db"
import { imageUrl } from "../context"
import * as crud from "../lib/crud"
import { api, body, fail, idOf, notFound, num, ok, query, text } from "../lib/http"
import { MAIN_BRANCH_ID } from "../seed/common"

const fieldsOf = (b: Record<string, unknown>) => ({
  categoryNameAr: text(b.categoryNameAr),
  categoryNameEn: text(b.categoryNameEn),
  categoryNameUr: text(b.categoryNameUr),
  description: text(b.description),
  parentCategoryId: num(b.parentCategoryId),
  displayOrder: num(b.displayOrder) ?? 0,
})

const present = (c: Row) => ({ ...c, imageUrl: imageUrl(c.imageUrl), subCategories: [] as unknown[] })

export const categoryHandlers = [
  // A plain array, sub-categories included (each points at its parent).
  http.get(api("/ProductCategories"), async ({ request }) => {
    const q = query(request)
    const rows = await crud.list("categories", { sortBy: q.sortBy ?? "displayOrder", descending: q.descending })
    return HttpResponse.json(rows.map(present))
  }),

  // Top-level categories with their children inside.
  http.get(api("/ProductCategories/MainCategory"), async () => {
    const rows = await crud.list("categories", { sortBy: "displayOrder" })
    return HttpResponse.json(rows.filter((c) => !c.parentCategoryId).map((c) => ({ ...present(c), subCategories: rows.filter((s) => s.parentCategoryId === c.id).map(present) })))
  }),

  http.post(api("/ProductCategories/create"), async ({ request }) => {
    const b = await body(request)
    await crud.create("categories", { branchId: num(b.branchId) ?? MAIN_BRANCH_ID, isActive: 1, imageUrl: null, ...fieldsOf(b) })
    return ok({ message: "تمت إضافة التصنيف بنجاح." })
  }),

  http.put(api("/ProductCategories/:id"), async ({ params, request }) => {
    const saved = await crud.update("categories", idOf(params), fieldsOf(await body(request)))
    return saved ? ok({ message: "تم تعديل التصنيف بنجاح." }) : notFound()
  }),

  http.delete(api("/ProductCategories/:id"), async ({ params }) => {
    const id = idOf(params)
    const used = await crud.list("products", { where: (p) => p.categoryId === id })
    if (used.length) return fail("لا يمكن حذف التصنيف لارتباطه بأصناف.")
    const children = await crud.list("categories", { where: (c) => c.parentCategoryId === id })
    if (children.length) return fail("لا يمكن حذف التصنيف لوجود تصنيفات فرعية تابعة له.")
    return (await crud.remove("categories", id)) ? ok({ message: "تم حذف التصنيف بنجاح." }) : notFound()
  }),
]
