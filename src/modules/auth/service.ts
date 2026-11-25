import { useAuthStore } from "@/shared/auth/authStore"
import { applyToken, type TokenResponse } from "@/shared/auth/tokens"
import { refreshAccessToken } from "@/shared/http/client"
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

  /** The answer is generic: it does not say whether the email is registered. */
  forgotPassword: (email: string) =>
    http<void>("/Auth/forgot-password", { method: "POST", data: JSON.stringify(email), headers: { "Content-Type": "application/json" } }),

  /** A correct code answers with `resetGrant`, the proof the next step must send back. Wrong or expired codes fail with an `OTP_*` code. */
  verifyOtp: ({ email, otp }: { email: string; otp: string }) =>
    http<{ resetGrant: string; expiresAtUtc: string }>("/Auth/verify-otp", { method: "POST", data: { email, otp } }),

  /** Sends the grant exactly as `verifyOtp` returned it, not the code. */
  resetPassword: ({ email, password, resetGrant }: { email: string; password: string; resetGrant: string }) =>
    http<void>("/Auth/reset-password", { method: "POST", data: { email, newPassword: password, resetGrant } }),
}
