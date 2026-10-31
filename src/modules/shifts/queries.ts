import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { refreshAccessToken } from "@/shared/http/client"
import { shiftsApi } from "./service"
import type { OpenShiftInput, ShiftQuery } from "./types"

export const shiftKeys = { all: ["shifts"] as const, list: ["shifts", "list"] as const, page: (q: ShiftQuery) => ["shifts", "list", q] as const, report: (id: number) => ["shifts", "report", id] as const }

export const useShifts = (q: ShiftQuery) => useQuery({ queryKey: shiftKeys.page(q), queryFn: () => shiftsApi.list(q), placeholderData: keepPreviousData })
export const useShiftReport = (id: number | undefined) => useQuery({ queryKey: shiftKeys.report(id ?? 0), queryFn: () => shiftsApi.report(id!), enabled: id != null })

export const useShiftBranches = (enabled: boolean) => useQuery({ queryKey: ["refs", "shift-branches"], queryFn: shiftsApi.branches, enabled, staleTime: 5 * 60_000 })
export const useShiftEmployees = (branchId: number) => useQuery({ queryKey: ["refs", "shift-employees", branchId], queryFn: () => shiftsApi.employees(branchId), enabled: branchId > 0 })
export const useShiftDevices = (enabled: boolean) => useQuery({ queryKey: ["refs", "shift-devices"], queryFn: shiftsApi.devices, enabled })

/** The access token carries the open shift's id, so it is renewed after every open or close. */
const renewToken = () => refreshAccessToken().catch(() => undefined)

function useShiftMutation<A>(fn: (a: A) => Promise<unknown>, ok: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: A) => { await fn(a); await renewToken() },
    onSuccess: () => { qc.invalidateQueries({ queryKey: shiftKeys.all }); toast.success(i18n.t(ok)) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useOpenShift = () => useShiftMutation((v: OpenShiftInput) => shiftsApi.open(v), "shifts.opened")
export const useCloseShift = () => useShiftMutation((id: number) => shiftsApi.close(id), "shifts.closed")
