import { http, HttpResponse } from "msw"
import type { Row } from "../db"
import * as crud from "../lib/crud"
import { api, body, bool, idOf, notFound, num, ok, query, text } from "../lib/http"
import { demoEmployee, MAIN_BRANCH_ID } from "../seed/common"

/** Recording an expense takes its amount out of the chosen treasury; deleting it puts it back. */
async function moveTreasury(treasuryId: unknown, amount: number) {
  const t = await crud.get("treasuries", Number(treasuryId))
  if (t) await crud.update("treasuries", t.id, { currentBalance: Number(t.currentBalance ?? 0) + amount })
}

async function present(rows: Row[]) {
  const [treasuries, items] = await Promise.all([crud.list("treasuries"), crud.list("expenseItems")])
  return rows.map((e) => ({ ...e, treasuryName: treasuries.find((t) => t.id === e.treasuryId)?.name ?? null, itemName: items.find((i) => i.id === e.itemId)?.name ?? null }))
}

const expenseOf = (b: Record<string, unknown>) => ({ name: text(b.name), amount: num(b.amount) ?? 0, date: text(b.date), notes: text(b.notes), treasuryId: num(b.treasuryId), itemId: num(b.itemId) })

export const expenseHandlers = [
  http.get(api("/Items"), async ({ request }) => {
    const q = query(request)
    return HttpResponse.json(crud.page(await crud.list("expenseItems", { sortBy: q.sortBy, descending: q.descending }), q.page, q.pageSize))
  }),
  http.get(api("/Items/:id"), async ({ params }) => {
    const row = await crud.get("expenseItems", idOf(params))
    return row ? HttpResponse.json(row) : notFound()
  }),
  http.post(api("/Items"), async ({ request }) => {
    await crud.create("expenseItems", { name: text((await body(request)).name), isActive: true })
    return ok()
  }),
  http.put(api("/Items/:id"), async ({ params, request }) => {
    const b = await body(request)
    return (await crud.update("expenseItems", idOf(params), { name: text(b.name), isActive: bool(b.isActive) ?? true })) ? ok() : notFound()
  }),
  http.delete(api("/Items/:id"), async ({ params }) => ((await crud.remove("expenseItems", idOf(params))) ? ok() : notFound())),

  http.get(api("/Expenses"), async ({ request }) => {
    const q = query(request)
    const rows = await crud.list("expenses", { search: q.search, searchIn: ["name", "notes"], sortBy: q.sortBy ?? "id", descending: q.sortBy ? q.descending : true })
    const page = crud.page(rows, q.page, q.pageSize)
    return HttpResponse.json({ ...page, items: await present(page.items) })
  }),
  http.post(api("/Expenses"), async ({ request }) => {
    const e = expenseOf(await body(request))
    await crud.create("expenses", { ...e, createdBy: demoEmployee.firstName, branchId: MAIN_BRANCH_ID })
    await moveTreasury(e.treasuryId, -e.amount)
    return ok({ success: true, message: "تم تسجيل المصروف بنجاح." })
  }),
  http.put(api("/Expenses/:id"), async ({ params, request }) => {
    const current = await crud.get("expenses", idOf(params))
    if (!current) return notFound()
    const e = expenseOf(await body(request))
    await moveTreasury(current.treasuryId, Number(current.amount ?? 0))
    await moveTreasury(e.treasuryId, -e.amount)
    await crud.update("expenses", current.id, e)
    return ok({ success: true, message: "تم تعديل المصروف بنجاح." })
  }),
  http.delete(api("/Expenses/:id"), async ({ params }) => {
    const current = await crud.get("expenses", idOf(params))
    if (!current) return notFound()
    await moveTreasury(current.treasuryId, Number(current.amount ?? 0))
    await crud.remove("expenses", current.id)
    return ok({ success: true, message: "تم حذف المصروف بنجاح." })
  }),
]
