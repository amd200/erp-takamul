import { http, HttpResponse } from "msw"
import type { Row } from "../db"
import { imageUrl } from "../context"
import * as crud from "../lib/crud"
import { api, body, bool, fail, idOf, json, notFound, num, ok, query, text, UNAVAILABLE } from "../lib/http"
import { MAIN_BRANCH_ID } from "../seed/common"

const KIND: Record<string, string> = { direct: "Direct", prepared: "Prepared", branched: "Branched", "raw-material": "RawMatrial" }

type Unit = { id?: number; unitId: number; conversionFactor: number; barcode?: string | null; sellingPrice?: number | null }
type Component = { componentProductId: number; unitId: number; quantity: number }

/** The item as the server sends it: the stored fields plus the names and prices it works out. */
async function present(p: Row, all?: Row[]) {
  const [categories, units, taxes] = await Promise.all([crud.list("categories"), crud.list("units"), crud.list("taxes")])
  const products = all ?? (await crud.list("products"))
  const rate = Number(taxes.find((t) => t.id === p.taxId)?.amount ?? 0)
  const price = Number(p.sellingPrice ?? 0)
  // 1 = no tax, 2 = the price includes tax, 3 = tax is added on top.
  const before = p.taxCalculation === 2 ? price / (1 + rate / 100) : price
  const after = p.taxCalculation === 3 ? price * (1 + rate / 100) : price
  const unitName = (id: unknown) => units.find((u) => u.id === id)?.name ?? null
  const childIds = (p.childrenIds as number[] | undefined) ?? []
  return {
    ...p,
    categoryName: categories.find((c) => c.id === p.categoryId)?.categoryNameAr ?? null,
    taxPercentage: p.taxCalculation === 1 ? 0 : rate,
    priceBeforeTax: Math.round(before * 100) / 100,
    priceAfterTax: Math.round(after * 100) / 100,
    imageUrl: imageUrl(p.imageUrl),
    units: ((p.units as Unit[] | undefined) ?? []).map((u) => ({ ...u, isBaseUnit: false, unitName: unitName(u.unitId) })),
    components: ((p.components as Component[] | undefined) ?? []).map((c) => ({ ...c, componentNameAr: products.find((x) => x.id === c.componentProductId)?.productNameAr ?? "" })),
    children: products.filter((x) => childIds.includes(x.id)).map((x) => ({ id: x.id, productCode: x.productCode, productNameAr: x.productNameAr, productNameEn: x.productNameEn, barcode: x.barcode, costPrice: x.costPrice, sellingPrice: x.sellingPrice })),
  }
}

/** Only the fields the request carries, typed back from form text. */
function fieldsOf(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  const set = (key: string, value: unknown) => { if (key in b) out[key] = value }
  set("productNameAr", text(b.productNameAr))
  set("productNameEn", text(b.productNameEn))
  set("productNameUr", text(b.productNameUr))
  set("description", text(b.description))
  set("categoryId", num(b.categoryId))
  set("printerName", text(b.printerName))
  set("displayOrder", num(b.displayOrder) ?? 0)
  set("calories", num(b.calories))
  set("barcode", text(b.barcode))
  set("baseUnitId", num(b.baseUnitId))
  set("sellingPrice", num(b.sellingPrice) ?? 0)
  set("costPrice", num(b.costPrice) ?? 0)
  set("showInSalesScreen", bool(b.showInSalesScreen) ?? true)
  set("minStockLevel", num(b.minStockLevel) ?? 0)
  set("taxId", num(b.taxId))
  set("taxCalculation", num(b.taxCalculation) ?? 1)
  set("taxExemptionReasonId", num(b.taxExemptionReasonId))
  set("purchaseUnitId", num(b.purchaseUnitId))
  set("conversionFactor", num(b.conversionFactor))
  if ("units" in b) out.units = json<Unit[]>(b.units, []).map((u) => ({ ...u, id: u.id ?? Math.floor(Math.random() * 1e9) }))
  if ("components" in b) out.components = json<Component[]>(b.components, [])
  if ("childrenIds" in b) out.childrenIds = ([] as unknown[]).concat(b.childrenIds).map(Number).filter(Number.isFinite)
  return out
}

/** A new picture is stored as uploaded; on edit, the kept one comes back as `imageUrl`. */
function imageOf(b: Record<string, unknown>, current?: Row) {
  if (typeof b.image === "string" && b.image) return b.image
  if (typeof b.imageUrl === "string" && b.imageUrl) return current?.imageUrl ?? b.imageUrl
  return null
}

export const productHandlers = [
  http.get(api("/Products"), async ({ request }) => {
    const q = query(request)
    const barcode = q.text("Barcode")
    const type = q.text("ProductType")
    const category = q.num("CategoryId")
    const rows = await crud.list("products", {
      search: q.search,
      searchIn: ["productNameAr", "productNameEn", "barcode", "productCode"],
      sortBy: q.sortBy,
      descending: q.descending,
      where: (p) => (!barcode || p.barcode === barcode || ((p.units as Unit[] | undefined) ?? []).some((u) => u.barcode === barcode))
        && (!type || p.productType === type) && (category == null || p.categoryId === category),
    })
    const all = await crud.list("products")
    const page = crud.page(rows, q.page, q.pageSize)
    return HttpResponse.json({ ...page, items: await Promise.all(page.items.map((p) => present(p, all))) })
  }),

  http.post(api("/Products/calculate-prepared-cost"), async ({ request }) => {
    const lines = (await body(request)) as unknown as Component[]
    const products = await crud.list("products")
    const totalCost = (Array.isArray(lines) ? lines : []).reduce((sum, c) => sum + Number(products.find((p) => p.id === c.componentProductId)?.costPrice ?? 0) * Number(c.quantity || 0), 0)
    return HttpResponse.json({ totalCost })
  }),

  http.put(api("/Products/update-category-printer"), async ({ request }) => {
    const { categoryId, printerName } = await body(request)
    const products = await crud.list("products", { where: (p) => p.categoryId === Number(categoryId) })
    await Promise.all(products.map((p) => crud.update("products", p.id, { printerName })))
    return ok()
  }),

  http.get(api("/Products/:id"), async ({ params }) => {
    const p = await crud.get("products", idOf(params))
    return p ? HttpResponse.json(await present(p)) : notFound()
  }),

  http.get(api("/Products/:kind/:id"), async ({ params }) => {
    const p = await crud.get("products", idOf(params))
    return p ? HttpResponse.json(await present(p)) : notFound()
  }),

  http.post(api("/Products/:kind"), async ({ params, request }) => {
    const productType = KIND[String(params.kind)]
    if (!productType) return fail(UNAVAILABLE)
    const b = await body(request)
    const all = await crud.list("products")
    const productCode = Math.max(1000, ...all.map((p) => Number(p.productCode ?? 0))) + 1
    await crud.create("products", {
      branchId: num(b.branchId) ?? MAIN_BRANCH_ID, productType, productCode, isActive: true, balance: productType === "Direct" || productType === "RawMatrial" ? 0 : null,
      units: [], components: [], childrenIds: [], ...fieldsOf(b), imageUrl: imageOf(b),
    })
    return ok({ success: true, message: "تمت إضافة الصنف بنجاح." })
  }),

  http.put(api("/Products/:kind/:id"), async ({ params, request }) => {
    const current = await crud.get("products", idOf(params))
    if (!current) return notFound()
    const b = await body(request)
    const isJson = !(request.headers.get("content-type") ?? "").includes("multipart")
    await crud.update("products", current.id, { ...fieldsOf(b), ...(isJson ? {} : { imageUrl: imageOf(b, current) }) })
    return ok({ success: true, message: "تم تعديل الصنف بنجاح." })
  }),

  http.delete(api("/Products/:id"), async ({ params }) => {
    return (await crud.remove("products", idOf(params))) ? ok({ message: "تم حذف الصنف بنجاح." }) : notFound()
  }),

  http.post(api("/ProductImport/import-excel"), () => fail(UNAVAILABLE)),
  http.get(api("/ProductImport/template"), () => fail(UNAVAILABLE)),
]
