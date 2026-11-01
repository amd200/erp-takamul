import { useState } from "react"
import { Building2 } from "lucide-react"
import { useIsMutating, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { activeBranchId, canManageAllBranches, useAuthStore, useBranchChoice } from "@/shared/auth/authStore"
import { useBranches } from "@/modules/lookups/service"

/**
 * The branch picker of the top bar, for SuperAdmin / multi-branch users. The choice goes out as X-Branch-Id on every
 * request; changing it reloads everything the branch owns (settings follow on their own: the branch is part of their key).
 */
export function BranchSwitcher() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const chosen = useBranchChoice((s) => s.branchId)
  const canManage = canManageAllBranches(session)
  const { data: branches } = useBranches()
  const [changing, setChanging] = useState(false)
  const saving = useIsMutating({ mutationKey: ["settings"] }) > 0
  if (!canManage) return null

  const current = activeBranchId()
  const change = async (value: string) => {
    const next = value === "all" ? null : Number(value)
    if (next === current || changing || saving) return
    setChanging(true)
    try {
      const data = { predicate: (q: { queryKey: readonly unknown[] }) => q.queryKey[0] !== "settings" }
      await qc.cancelQueries(data)
      useBranchChoice.getState().select(session?.userId ?? null, next)
      await qc.resetQueries(data)
    } catch {
      toast.error(t("topbar.branchChangeFailed"))
    } finally {
      setChanging(false)
    }
  }

  return (
    <Select disabled={changing || saving} value={current == null ? "all" : String(current)} onValueChange={change}>
      <SelectTrigger aria-label={t("topbar.selectBranch")} title={t("topbar.selectBranch")} data-chosen={chosen ?? ""}
        className="h-9 w-auto min-w-0 max-w-40 gap-1.5 px-2.5 text-xs sm:w-40 sm:max-w-none sm:text-sm lg:w-48">
        <Building2 size={15} className="shrink-0 text-primary" />
        <SelectValue placeholder={t("topbar.selectBranch")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("topbar.allBranches")}</SelectItem>
        {branches?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
