import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/**
 * The signed-in session. The access token lives in memory only (never in storage); the refresh
 * token is an HttpOnly cookie the server manages, so a page reload signs back in through
 * /Auth/refresh-token. `initialized` is false until that first attempt finishes.
 */
export type Session = {
  accessToken: string
  expiresAt: number
  userId: string | null
  userName: string | null
  email: string | null
  role: string | null
  branchId: number | null
  isMultiBranch: boolean
  /** Raw backend permission strings from the token. */
  backendPermissions: string[]
}

type AuthState = {
  session: Session | null
  initialized: boolean
  setSession: (s: Session) => void
  clear: () => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session, initialized: true }),
  clear: () => set({ session: null, initialized: true }),
  setInitialized: () => set({ initialized: true }),
}))

/** The branch a multi-branch user picked in the header. Other users are always pinned to their own branch by the server. */
type BranchChoice = { ownerUserId: string | null; branchId: number | null; select: (userId: string | null, branchId: number | null) => void }
export const useBranchChoice = create<BranchChoice>()(
  persist(
    (set) => ({ ownerUserId: null, branchId: null, select: (ownerUserId, branchId) => set({ ownerUserId, branchId }) }),
    { name: "selected-branch", storage: createJSONStorage(() => localStorage) },
  ),
)

export const canManageAllBranches = (s: Session | null) => !!s && (s.isMultiBranch || s.role === "SuperAdmin")

/** The branch every request is scoped to, or null to let the server use the user's own. */
export function activeBranchId(): number | null {
  const { session } = useAuthStore.getState()
  const choice = useBranchChoice.getState()
  if (!session || !canManageAllBranches(session)) return null
  return choice.ownerUserId === session.userId && choice.branchId && choice.branchId > 0 ? choice.branchId : null
}
