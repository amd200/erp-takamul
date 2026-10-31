import type { ReactNode } from "react"
import { useSession } from "@/shared/session/session"
import type { Permission } from "./permissions"

export function useCan() {
  const { permissions } = useSession()
  return (p: Permission | Permission[]) => (Array.isArray(p) ? p.some((x) => permissions.has(x)) : permissions.has(p))
}

/** Renders children only when the signed-in user holds the permission (any of them, for a list). */
export function Can({ perm, children, fallback = null }: { perm: Permission | Permission[]; children: ReactNode; fallback?: ReactNode }) {
  return useCan()(perm) ? children : fallback
}
