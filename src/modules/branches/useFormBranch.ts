import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { canManageAllBranches, headerBranchId, useAuthStore, useBranchChoice, useFormBranchScope } from "@/shared/auth/authStore"
import { refKeys } from "@/shared/api/keys"

/** The lists the add forms offer (categories, units, taxes, items, treasuries...). */
const LOOKUP_ROOTS: string[] = ["units", "categories", "products", "additions", "warehouses", "stock-rows", "treasuries", "customers", "suppliers", refKeys.all[0]]

/**
 * The branch a new record is created on, picked in its own form. Only SuperAdmin / multi-branch users pick it; the rest
 * are pinned to their own branch by the server. It starts on the header's branch ("all branches" falls back to the user's
 * own, since a record needs one branch). While the form is open every request goes to the picked branch, so the lists
 * it offers (categories, units, taxes...) are that branch's; picking never changes the header. The header always moves the form to its new branch, even after a pick in the form.
 *
 * Pass `active` false while the form is closed or editing (a dialog stays mounted; an edit keeps the record's own branch).
 * `show` says whether the picker belongs on screen.
 */
export function useFormBranch(active = true) {
  const qc = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const canPick = canManageAllBranches(session)
  const on = active && canPick
  const started = useRef<number | null | undefined>(undefined)
  // Set while rendering for the first time, so the form's very first requests already go to this branch.
  if (on && started.current === undefined) {
    started.current = headerBranchId() ?? session?.branchId ?? null
    useFormBranchScope.getState().set(started.current)
  }
  const branchId = useFormBranchScope((s) => s.branchId)

  // Only the lists a form offers are read again when the scope moves, and in place (the old rows stay on screen until the new ones
  // arrive): the rest of the app is not reloaded or emptied by a pick made inside a form. Settings follow on their own (the branch is in their key).
  const lookup = { predicate: (q: { queryKey: readonly unknown[] }) => LOOKUP_ROOTS.includes(q.queryKey[0] as string) }
  const reload = () => qc.invalidateQueries(lookup)

  useEffect(() => {
    if (!on) return
    if (started.current === undefined) started.current = headerBranchId() ?? session?.branchId ?? null
    useFormBranchScope.getState().set(started.current)
    // Runs synchronously inside the header's own change, before it reloads, so that reload already goes to the new branch.
    const unsubscribe = useBranchChoice.subscribe((now, before) => {
      if (now.branchId === before.branchId) return
      useFormBranchScope.getState().set(headerBranchId() ?? useAuthStore.getState().session?.branchId ?? null)
    })
    return () => {
      unsubscribe()
      started.current = undefined
      useFormBranchScope.getState().set(null)
      void reload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  const pick = async (next: number) => {
    if (next === branchId) return
    await qc.cancelQueries(lookup)
    useFormBranchScope.getState().set(next)
    await reload()
  }

  return { canPick, show: on, branchId: on ? branchId : null, pick }
}
