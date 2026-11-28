import { http, HttpResponse } from "msw"
import * as crud from "../lib/crud"
import { api, body, fail, idOf, notFound, ok, query } from "../lib/http"
import { DEFAULT_CUSTOMER_ID, MAIN_BRANCH_ID } from "../seed/common"

/** Customers and suppliers: the forms already send the server's field names, so the body is stored as it comes. */
function partyHandlers(path: string, table: "customers" | "suppliers", nameField: string, protectedId: number | null, words: { added: string; edited: string; deleted: string; locked: string }) {
  return [
    http.get(api(path), async ({ request }) => {
      const q = query(request)
      const rows = await crud.list(table, { search: q.search, searchIn: [nameField, "phone"], sortBy: q.sortBy, descending: q.descending })
      return HttpResponse.json(crud.page(rows, q.page, q.pageSize))
    }),
    http.get(api(`${path}/:id`), async ({ params }) => {
      const row = await crud.get(table, idOf(params))
      return row ? HttpResponse.json(row) : notFound()
    }),
    http.post(api(path), async ({ request }) => {
      const b = await body(request)
      await crud.create(table, { isActive: true, balance: 0, createdAt: new Date().toISOString(), ...b, branchId: b.branchId ?? MAIN_BRANCH_ID })
      return ok({ success: true, message: words.added })
    }),
    http.put(api(`${path}/:id`), async ({ params, request }) => {
      const saved = await crud.update(table, idOf(params), await body(request))
      return saved ? ok({ success: true, message: words.edited }) : notFound()
    }),
    http.delete(api(`${path}/:id`), async ({ params }) => {
      const id = idOf(params)
      if (id === protectedId) return fail(words.locked)
      return (await crud.remove(table, id)) ? ok({ success: true, message: words.deleted }) : notFound()
    }),
  ]
}

export const partnerHandlers = [
  ...partyHandlers("/Customer", "customers", "customerName", DEFAULT_CUSTOMER_ID, {
    added: "تمت إضافة العميل بنجاح.", edited: "تم تعديل العميل بنجاح.", deleted: "تم حذف العميل بنجاح.", locked: "لا يمكن حذف العميل الافتراضي.",
  }),
  ...partyHandlers("/Suppliers", "suppliers", "supplierName", null, {
    added: "تمت إضافة المورد بنجاح.", edited: "تم تعديل المورد بنجاح.", deleted: "تم حذف المورد بنجاح.", locked: "",
  }),
]
