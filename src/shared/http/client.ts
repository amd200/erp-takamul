import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import i18n from "@/shared/i18n"
import { activeBranchId, useAuthStore } from "@/shared/auth/authStore"
import { applyToken, type TokenResponse } from "@/shared/auth/tokens"
import { API_BASE_URL } from "./config"

export const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true })

client.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = i18n.language === "en" ? "en" : "ar"
  const token = useAuthStore.getState().session?.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  // A request that sets its own X-Branch-Id (creating a record for a specific branch) keeps it.
  const branch = activeBranchId()
  if (branch && config.headers["X-Branch-Id"] == null) config.headers["X-Branch-Id"] = String(branch)
  return config
})

const REFRESH_URL = "/Auth/refresh-token"
const REFRESH_TIMEOUT = 10_000
let refreshing: Promise<string> | null = null

/**
 * One refresh at a time. Requests that hit a 401 while it runs share the same promise,
 * then retry with the new token.
 */
export function refreshAccessToken(): Promise<string> {
  refreshing ??= client
    .post<TokenResponse>(REFRESH_URL, undefined, { timeout: REFRESH_TIMEOUT })
    .then(({ data }) => applyToken(data).accessToken)
    .finally(() => { refreshing = null })
  return refreshing
}

type Retryable = InternalAxiosRequestConfig & { _retry?: boolean }

client.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as Retryable | undefined
    const isAuthCall = original?.url?.includes("/Auth/login") || original?.url?.includes(REFRESH_URL)
    if (err.response?.status !== 401 || !original || original._retry || isAuthCall) return Promise.reject(err)

    original._retry = true
    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return client(original)
    } catch {
      // The refresh cookie is gone or expired: sign out. The caller still gets its own 401.
      useAuthStore.getState().clear()
      return Promise.reject(err)
    }
  },
)
