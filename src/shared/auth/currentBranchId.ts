import { useAuthStore } from "./authStore"

/** New records go to the branch picked in the header (multi-branch users); others get their own. */
export const currentBranchId = () => useAuthStore.getState().session?.branchId ?? null
