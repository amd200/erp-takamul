import { useAuthStore } from "@/shared/auth/authStore"
import { applyToken, type TokenResponse } from "@/shared/auth/tokens"
import { refreshAccessToken } from "@/shared/http/client"
import i18n from "@/shared/i18n"
import { ApiError } from "@/shared/http/ApiError"
import { http } from "@/shared/http/request"

/** Stable id for this browser; the server limits a user to one device at a time ("DEVICE_CONFLICT"). */
function deviceId() {
  try {
    let id = localStorage.getItem("deviceId")
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("deviceId", id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export const authApi = {
  login: async (input: { identifier: string; password: string }) =>
    applyToken(await http<TokenResponse>("/Auth/login", { method: "POST", data: { ...input, deviceIdentifier: deviceId() } })),

  /** Signs out of every other device so this one can sign in. */
  logoutAll: (identifier: string) =>
    http<void>("/Auth/logout-all", { method: "POST", data: JSON.stringify(identifier), headers: { "Content-Type": "application/json" } }),

  logout: async () => {
    try { await http<void>("/Auth/logout", { method: "POST" }) } finally { useAuthStore.getState().clear() }
  },

  /** On app start: trade the refresh cookie for an access token. Quiet when there is no cookie. */
  restore: async () => {
    try { await refreshAccessToken() } catch { useAuthStore.getState().clear() }
  },

  forgotPassword: (email: string) =>
    http<void>("/Auth/forget-password", { method: "POST", data: JSON.stringify(email), headers: { "Content-Type": "application/json" } }),

  /** The server answers 200 even for a wrong code; only the message "OTP_VALID" means it matched. */
  verifyOtp: async ({ email, otp }: { email: string; otp: string }) => {
    const res = await http<{ message?: string }>("/Auth/verify-otp", { method: "POST", data: { email, otp } })
    if (res?.message !== "OTP_VALID") throw new ApiError(res?.message ?? i18n.t("common.unexpected"), 400)
  },

  resetPassword: ({ email, password }: { email: string; password: string }) =>
    http<void>("/Auth/reset-password", { method: "POST", data: { email, newPassword: password } }),
}
