import { useMemo } from "react"
import { useAuthStore } from "@/shared/auth/authStore"
import { grantedPermissions } from "@/shared/auth/permissionMap"

/** The signed-in user, their branch and what they may do, read from the token. */
export function useSession() {
  const s = useAuthStore((x) => x.session)
  return useMemo(() => ({
    user: { name: s?.userName ?? "", role: s?.role ?? "" },
    branch: { id: s?.branchId ?? null },
    permissions: grantedPermissions(s?.backendPermissions ?? [], s?.role === "SuperAdmin"),
  }), [s])
}
