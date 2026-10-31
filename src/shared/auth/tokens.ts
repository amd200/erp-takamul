import { jwtDecode } from "jwt-decode"
import { useAuthStore, type Session } from "./authStore"

export type TokenResponse = { accessToken: string; accessTokenExpiration: string; roles?: string[] }

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"

type Claims = {
  exp?: number
  sub?: string
  UserId?: string
  username?: string
  email?: string
  BranchId?: string
  IsMultiBranch?: string | boolean
  Permission?: string | string[]
  [ROLE_CLAIM]?: string | string[]
}

const toArray = (v: unknown): string[] => (v == null ? [] : Array.isArray(v) ? v.flatMap(toArray) : typeof v === "string" ? [v] : [])

/** Turns a login / refresh response into the session, and stores it. */
export function applyToken(res: TokenResponse): Session {
  const c = jwtDecode<Claims>(res.accessToken)
  const expires = Date.parse(res.accessTokenExpiration)
  const branch = Number(c.BranchId)
  const session: Session = {
    accessToken: res.accessToken,
    expiresAt: Number.isFinite(expires) ? expires : (c.exp ?? 0) * 1000,
    userId: c.UserId?.trim() || c.sub?.trim() || null,
    userName: c.username ?? null,
    email: c.email ?? null,
    role: toArray(c[ROLE_CLAIM])[0] ?? res.roles?.[0] ?? null,
    branchId: Number.isSafeInteger(branch) && branch > 0 ? branch : null,
    isMultiBranch: c.IsMultiBranch === true || c.IsMultiBranch === "True",
    backendPermissions: toArray(c.Permission),
  }
  useAuthStore.getState().setSession(session)
  return session
}
