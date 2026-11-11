import { useTranslation } from "react-i18next"
import type { Column } from "@/components/DataTable"
import { useBranches } from "@/modules/lookups/service"
import { canManageAllBranches, useAuthStore } from "@/shared/auth/authStore"

/**
 * The "Branch" column of a list, only for SuperAdmin / multi-branch users (everyone else sees one branch).
 * `pick` gives the row's branch as the server sent it: the id, the name, or both. The name sent by the server wins; else the id is looked up.
 * Sortable by the server key `branchName` (same key Employees / Treasuries / POS devices use).
 * Spread the result into the columns: `...branchColumn`.
 */
export function useBranchColumn<T>(pick: (row: T) => { id?: number | null; name?: string | null }): Column<T>[] {
  const { t } = useTranslation()
  const show = useAuthStore((s) => canManageAllBranches(s.session))
  const { data: branches = [] } = useBranches()
  if (!show) return []
  return [{
    id: "branch",
    sortKey: "branchName",
    header: t("common.branch"),
    cell: (row) => {
      const b = pick(row)
      return b.name || branches.find((x) => x.id === b.id)?.name || "—"
    },
  }]
}
