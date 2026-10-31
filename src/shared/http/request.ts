import axios from "axios"
import i18n from "@/shared/i18n"
import { client } from "./client"
import { ApiError } from "./ApiError"

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
    return res.data as T
  } catch (e) {
    if (axios.isCancel(e)) throw e
    if (!axios.isAxiosError(e)) throw e
    if (!e.response) {
      const timeout = e.code === "ECONNABORTED" || e.code === "ETIMEDOUT"
      throw new ApiError(i18n.t(timeout ? "common.timeout" : "common.network"), 0, { code: timeout ? "TIMEOUT" : "NETWORK", cause: e })
    }
    const body = e.response.data
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
  return pick ?? fallback
}

/** `errors` is a list, or ASP.NET validation's `{ Field: ["..."] }`; both become one list. */
function toErrorList(errors: unknown): string[] {
  const values = Array.isArray(errors) ? errors : errors && typeof errors === "object" ? Object.values(errors).flat() : []
  return values.filter((v): v is string => typeof v === "string" && v.trim() !== "")
}
