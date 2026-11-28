import { http, HttpResponse } from "msw"
import type { Row } from "../db"
import { imageUrl } from "../context"
import * as crud from "../lib/crud"
import { api, body, bool, fail, idOf, notFound, ok } from "../lib/http"
import { MAIN_BRANCH_ID } from "../seed/common"

/** The form's text fields, stored under the server's names (the request sends them with a capital first letter). */
const TEXT_FIELDS = [
  "code", "name", "nameEn", "shortName", "shortNameEn", "phone", "commercialRegister", "taxNumber", "footerNote", "iban", "bankName", "bankNameEn",
  "bankAccountName", "bankAccountNameEn", "bankAccountNumber", "street", "district", "buildingNumber", "subNumber", "postalCode", "cityName",
  "stateName", "locationAddress", "organizationUnitName", "industryBusinessCategory",
]

function fieldsOf(b: Record<string, unknown>, current?: Row) {
  const out: Record<string, unknown> = Object.fromEntries(TEXT_FIELDS.filter((k) => k in b).map((k) => [k, String(b[k] ?? "") || null]))
  // A new picture replaces the old one; on edit an unchanged picture comes back as ImageUrl, a removed one not at all.
  out.imageUrl = typeof b.image === "string" && b.image ? b.image : typeof b.imageUrl === "string" && b.imageUrl ? current?.imageUrl ?? b.imageUrl : null
  if (typeof b.stampImage === "string" && b.stampImage) out.stampImageUrl = b.stampImage
  if ("isActive" in b) out.isActive = bool(b.isActive)
  return out
}

const present = (b: Row) => ({ ...b, imageUrl: imageUrl(b.imageUrl), stampImageUrl: imageUrl(b.stampImageUrl) })

export const branchHandlers = [
  http.get(api("/Branch"), async () => HttpResponse.json((await crud.list("branches")).map(present))),
  // The public ordering screen reads the branch without signing in.
  http.get(api("/Branch/public-info"), async () => HttpResponse.json(present((await crud.get("branches", MAIN_BRANCH_ID))!))),
  http.get(api("/Branch/:id"), async ({ params }) => {
    const row = await crud.get("branches", idOf(params))
    return row ? HttpResponse.json(present(row)) : notFound()
  }),
  http.post(api("/Branch"), async ({ request }) => {
    await crud.create("branches", { isActive: true, ...fieldsOf(await body(request)) })
    return ok({ success: true, message: "تمت إضافة الفرع بنجاح." })
  }),
  http.put(api("/Branch/:id"), async ({ params, request }) => {
    const current = await crud.get("branches", idOf(params))
    if (!current) return notFound()
    await crud.update("branches", current.id, fieldsOf(await body(request), current))
    return ok({ success: true, message: "تم تعديل الفرع بنجاح." })
  }),
  http.delete(api("/Branch/:id"), async ({ params }) => {
    const id = idOf(params)
    if (id === MAIN_BRANCH_ID) return fail("لا يمكن حذف الفرع الرئيسي.")
    return (await crud.remove("branches", id)) ? new HttpResponse(null, { status: 204 }) : notFound()
  }),
]
