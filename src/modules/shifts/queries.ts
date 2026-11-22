import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { refreshAccessToken } from "@/shared/http/client"
import { shiftsApi } from "./service"
import type { OpenShiftInput } from "./types"
import { shiftKeys } from "./keys"

export const useShifts = () => useQuery({ queryKey: shiftKeys.list, queryFn: shiftsApi.list })
export const useShiftReport = (id: number | undefined) => useQuery({ queryKey: shiftKeys.report(id ?? 0), queryFn: () => shiftsApi.report(id!), enabled: id != null, staleTime: 0, refetchOnMount: "always" })

export const useShiftBranches = (enabled: boolean) => useQuery({ queryKey: shiftKeys.branches, queryFn: shiftsApi.branches, enabled, staleTime: 5 * 60_000 })
export const useShiftEmployees = (branchId: number) => useQuery({ queryKey: shiftKeys.employees(branchId), queryFn: () => shiftsApi.employees(branchId), enabled: branchId > 0 })
export const useShiftDevices = (enabled: boolean) => useQuery({ queryKey: shiftKeys.devices, queryFn: shiftsApi.devices, enabled })

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
