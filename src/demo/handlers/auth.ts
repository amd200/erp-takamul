import { http, HttpResponse } from "msw"
import { getDb } from "../db"
import { api, fail, ok, UNAVAILABLE } from "../lib/http"
import { DEMO_EMPLOYEE_ID, DEMO_USER, MAIN_BRANCH_ID } from "../seed/common"

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
const SIGNED_OUT = "signedOut"

const base64Url = (value: unknown) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")

/** An unsigned token with the claims the app reads: the demo account, branch 1, full permissions (SuperAdmin). */
function token() {
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000)
  const claims = {
    UserId: String(DEMO_EMPLOYEE_ID),
    username: DEMO_USER.userName,
    email: DEMO_USER.email,
    BranchId: String(MAIN_BRANCH_ID),
    IsMultiBranch: "True",
    [ROLE_CLAIM]: DEMO_USER.role,
    exp: Math.floor(expires.getTime() / 1000),
  }
  return { accessToken: `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url(claims)}.`, accessTokenExpiration: expires.toISOString(), roles: [DEMO_USER.role] }
}

export const authHandlers = [
  // Signed in automatically, unless the visitor chose to sign out.
  http.post(api("/Auth/refresh-token"), async () => {
    if (await getDb().meta.get(SIGNED_OUT)) return fail("انتهت الجلسة.", 401)
    return HttpResponse.json(token())
  }),
  // Any user name and password are accepted.
  http.post(api("/Auth/login"), async () => {
    await getDb().meta.delete(SIGNED_OUT)
    return HttpResponse.json(token())
  }),
  http.post(api("/Auth/logout"), async () => {
    await getDb().meta.put({ key: SIGNED_OUT, value: true })
    return ok()
  }),
  http.post(api("/Auth/logout-all"), () => ok()),
  http.post(api("/Auth/forget-password"), () => fail(UNAVAILABLE)),
  http.post(api("/Auth/verify-otp"), () => fail(UNAVAILABLE)),
  http.post(api("/Auth/reset-password"), () => fail(UNAVAILABLE)),
]
