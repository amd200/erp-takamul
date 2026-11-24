import axios from "axios"
import i18n from "@/shared/i18n"
import { client } from "./client"
import { ApiError } from "./ApiError"
import { reportApiFailure } from "@/shared/monitoring/sentry"

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  responseType?: "json" | "blob"
  timeout?: number
  signal?: AbortSignal
}

/** Typed request that throws `ApiError` for every failure, whatever shape the server's error body has. */
export async function http<T>(url: string, o: Options = {}): Promise<T> {
  try {
    const res = await client({ url, method: o.method ?? "GET", params: o.params, data: o.data, headers: o.headers, responseType: o.responseType, timeout: o.timeout, signal: o.signal })
    if (o.responseType === "blob" && res.data instanceof Blob && res.data.type.includes("json")) {
      const body = await readBlobJson(res.data)
      if (body && typeof body === "object" && (body as { success?: unknown }).success === false) {
        const errors = toErrorList((body as { errors?: unknown }).errors)
        throw new ApiError(toErrorMessage(body, errors, i18n.t("common.unexpected")), res.status, { errors })
      }
    }
    return res.data as T
  } catch (e) {
    if (axios.isCancel(e) || e instanceof ApiError) throw e
    if (!axios.isAxiosError(e)) throw e
    if (!e.response) {
      reportApiFailure(o.method ?? "GET", url, 0)
      const timeout = e.code === "ECONNABORTED" || e.code === "ETIMEDOUT"
      throw new ApiError(i18n.t(timeout ? "common.timeout" : "common.network"), 0, { code: timeout ? "TIMEOUT" : "NETWORK", cause: e })
    }
    if (e.response.status >= 500) reportApiFailure(o.method ?? "GET", url, e.response.status)
    // A blob request's error body arrives as a Blob; read it back to the JSON the server sent.
    const body = e.response.data instanceof Blob ? await readBlobJson(e.response.data) : e.response.data
    const errors = toErrorList((body as { errors?: unknown } | undefined)?.errors)
    throw new ApiError(toErrorMessage(body, errors, i18n.t("common.unexpected")), e.response.status, { errors, code: (body as { code?: string } | undefined)?.code, cause: e })
  }
}

/**
 * The message for an error body: a plain string, `{ details | message | errorMessage | error }`, or
 * ASP.NET's `{ title, detail, errors }`. ASP.NET's `title` is a generic English line, so the first
 * `errors` entry wins over it.
 */
function toErrorMessage(data: unknown, errors: string[], fallback: string): string {
  if (typeof data === "string" && data.trim()) return data
  const b = data && typeof data === "object" ? (data as Record<string, unknown>) : {}
  const pick = [b.details, b.message, b.errorMessage, b.error, b.detail, errors[0], b.title].find((v): v is string => typeof v === "string" && v.trim() !== "")
  // The back end's model-validation answer lists the offending field names in `fields`; keep them visible.
  const fields = Array.isArray(b.fields) ? b.fields.filter((v): v is string => typeof v === "string" && v !== "") : []
  const text = pick ?? fallback
  return fields.length ? `${text} (${fields.join(", ")})` : text
}

/** `errors` is a list, or ASP.NET validation's `{ Field: ["..."] }`; both become one list. */
function toErrorList(errors: unknown): string[] {
  const values = Array.isArray(errors) ? errors : errors && typeof errors === "object" ? Object.values(errors).flat() : []
  return values.filter((v): v is string => typeof v === "string" && v.trim() !== "")
}

/** A blob's text as JSON (or the plain text when it isn't JSON). */
async function readBlobJson(blob: Blob): Promise<unknown> {
  const text = await blob.text()
  try { return JSON.parse(text) } catch { return text }
}
