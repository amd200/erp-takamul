import { http, HttpResponse } from "msw"
import type { Row } from "../db"
import * as crud from "../lib/crud"
import { api, body, fail, idOf, notFound, num, ok, query, text } from "../lib/http"
import { DEMO_EMPLOYEE_ID, MAIN_BRANCH_ID } from "../seed/common"

/** Employees and users are one table: an employee with a `userName` can sign in. */
async function present(rows: Row[]) {
  const [branches, roles] = await Promise.all([crud.list("branches"), crud.list("roles")])
  return rows.map((e) => {
    const role = roles.find((r) => r.roleName === e.roleName)
    return { ...e, branchName: branches.find((b) => b.id === e.branchId)?.name ?? null, roles: role ? [{ roleId: role.id, roleName: role.roleName }] : [] }
  })
}

async function paged(request: Request, where?: (e: Row) => boolean) {
  const q = query(request)
  const rows = await crud.list("employees", { where, search: q.search, searchIn: ["firstName", "userName", "mobile"], sortBy: q.sortBy, descending: q.descending })
  const page = crud.page(rows, q.page, q.pageSize)
  return HttpResponse.json({ ...page, items: await present(page.items) })
}

const branchHeader = (request: Request) => num(request.headers.get("X-Branch-Id")) ?? MAIN_BRANCH_ID
const LOCKED = "لا يمكن حذف حساب النسخة التجريبية."

export const userHandlers = [
  http.get(api("/employees"), ({ request }) => paged(request)),
  http.get(api("/employees/GetAllUsers"), ({ request }) => paged(request, (e) => !!e.userName)),
  http.get(api("/employees/:id"), async ({ params }) => {
    const row = await crud.get("employees", idOf(params))
    return row ? HttpResponse.json((await present([row]))[0]) : notFound()
  }),

  http.post(api("/employees/CreateEmployee"), async ({ request }) => {
    const b = await body(request)
    await crud.create("employees", { firstName: text(b.firstName), lastName: "", mobile: text(b.mobile), branchId: num(b.branchId) ?? branchHeader(request) })
    return ok({ message: "تمت إضافة الموظف بنجاح." })
  }),
  http.post(api("/employees/createuser"), async ({ request }) => {
    const { employee = {}, user = {}, roleName } = (await body(request)) as Record<string, Record<string, unknown>>
    const userName = text(user.userName)
    if ((await crud.list("employees")).some((e) => e.userName === userName)) return fail("اسم المستخدم مستخدم من قبل.")
    await crud.create("employees", {
      firstName: text(employee.firstName), lastName: "", mobile: text(employee.mobile), branchId: branchHeader(request),
      userName, email: text(user.email), isMultiBranch: user.isMultiBranch === true, roleName: text(roleName),
    })
    return ok({ message: "تمت إضافة المستخدم بنجاح." })
  }),
  http.put(api("/employees/:id/user"), async ({ params, request }) => {
    const b = await body(request)
    // Changing the password only: nothing is stored, any password is accepted in the demo.
    if (!("userName" in b)) return ok({ message: "تم تغيير كلمة المرور بنجاح." })
    const saved = await crud.update("employees", idOf(params), {
      userName: text(b.userName), email: text(b.email), roleName: text(b.roleName), mobile: text(b.mobile), branchId: num(b.branchId), isMultiBranch: b.isMultiBranch === true,
    })
    return saved ? ok({ message: "تم تعديل المستخدم بنجاح." }) : notFound()
  }),
  http.put(api("/employees/:id"), async ({ params, request }) => {
    const b = await body(request)
    const saved = await crud.update("employees", idOf(params), { firstName: text(b.firstName), mobile: text(b.mobile), ...(b.branchId ? { branchId: num(b.branchId) } : {}) })
    return saved ? ok({ message: "تم تعديل الموظف بنجاح." }) : notFound()
  }),
  http.delete(api("/employees/:id/with-user"), async ({ params }) => {
    if (idOf(params) === DEMO_EMPLOYEE_ID) return fail(LOCKED)
    return (await crud.remove("employees", idOf(params))) ? ok({ message: "تم حذف المستخدم بنجاح." }) : notFound()
  }),
  http.delete(api("/employees/:id"), async ({ params }) => {
    if (idOf(params) === DEMO_EMPLOYEE_ID) return fail(LOCKED)
    return (await crud.remove("employees", idOf(params))) ? ok({ message: "تم حذف الموظف بنجاح." }) : notFound()
  }),

  // Roles: the id is text on the server.
  http.get(api("/permissions/AllRoles"), async ({ request }) => {
    const q = query(request)
    const rows = await crud.list("roles", { sortBy: q.sortBy, descending: q.descending })
    return HttpResponse.json(crud.page(rows.map(({ roleId, roleName }) => ({ roleId, roleName })), q.page, q.pageSize))
  }),
  http.get(api("/role-permissions/:roleId"), async ({ params }) => {
    const role = await crud.get("roles", Number(params.roleId))
    return role ? HttpResponse.json({ roleId: role.roleId, roleName: role.roleName, permissions: role.permissions ?? [] }) : notFound()
  }),
  http.post(api("/permissions/upsert"), async ({ request }) => {
    const b = await body(request)
    if ((await crud.list("roles")).some((r) => r.roleName === b.roleName)) return fail("اسم الدور مستخدم من قبل.")
    const row = await crud.create("roles", { roleName: text(b.roleName), permissions: b.permissions ?? [] })
    await crud.update("roles", row.id, { roleId: String(row.id) })
    return ok()
  }),
  http.post(api("/role-permissions/update"), async ({ request }) => {
    const b = await body(request)
    return (await crud.update("roles", Number(b.roleId), { permissions: b.permissions ?? [] })) ? ok() : notFound()
  }),
  http.delete(api("/permissions/RemoveRole/:name"), async ({ params }) => {
    const role = (await crud.list("roles")).find((r) => r.roleName === params.name)
    if (!role) return notFound()
    if (role.roleName === "SuperAdmin") return fail("لا يمكن حذف دور المدير العام.")
    await crud.remove("roles", role.id)
    return ok()
  }),
]
