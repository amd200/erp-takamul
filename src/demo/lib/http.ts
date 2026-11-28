import { HttpResponse } from "msw"

/** Every handler path starts with this; "*" so the demo answers whatever server address the build was given. */
export const api = (path: string) => `*/api${path}`

export const ok = (body: unknown = { success: true, message: "تمت العملية بنجاح." }) => HttpResponse.json(body as never)

export const fail = (message: string, status = 400) => HttpResponse.json({ success: false, message }, { status })

export const notFound = () => fail("السجل غير موجود.", 404)

export const UNAVAILABLE = "هذه العملية غير متاحة في النسخة التجريبية."

/** The query string as numbers / text, the way the app sends Page, PageSize, SearchTerm... */
export function query(request: Request) {
  const params = new URL(request.url).searchParams
  const text = (name: string) => params.get(name)
  const num = (name: string) => {
    const v = params.get(name)
    return v == null || v === "" ? undefined : Number(v)
  }
  return {
    text,
    num,
    page: num("Page") ?? num("PageNumber") ?? num("pageNumber") ?? 1,
    pageSize: num("PageSize") ?? num("pageSize") ?? 20,
    search: text("SearchTerm") ?? text("searchTerm") ?? text("search"),
    sortBy: text("SortBy"),
    descending: text("SortDescending") === "true",
  }
}

const lowerFirst = (k: string) => k.charAt(0).toLowerCase() + k.slice(1)

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * The request body as one object. A JSON body is returned as is; a multipart form becomes text fields with the
 * first letter lowered (the app sends both `CategoryNameAr` and `productNameAr`), and an uploaded file becomes a
 * data URL so it can be stored in the browser.
 */
export async function body(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? ""
  if (type.includes("multipart/form-data")) {
    const form = await request.formData()
    const out: Record<string, unknown> = {}
    for (const [key, value] of form.entries()) {
      const k = lowerFirst(key)
      const v = typeof value === "string" ? value : await fileToDataUrl(value)
      if (k in out) out[k] = ([] as unknown[]).concat(out[k], v)
      else out[k] = v
    }
    return out
  }
  const text = await request.text()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === "object" ? parsed : { value: parsed }
  } catch {
    return {}
  }
}

/** Form fields arrive as text: these turn them back into the server's types. */
export const num = (v: unknown): number | null => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null)
export const bool = (v: unknown): boolean | null => (v === true || v === "true" || v === "True" ? true : v === false || v === "false" || v === "False" ? false : null)
export const text = (v: unknown): string | null => (v == null || v === "" ? null : String(v))
export const json = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== "string") return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

export const idOf = (params: Record<string, unknown>) => Number(params.id)

export const nowIso = () => new Date().toISOString()
