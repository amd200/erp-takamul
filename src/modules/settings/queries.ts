import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { useAuthStore, useBranchChoice } from "@/shared/auth/authStore"
import { loyaltyApi, settingsApi, type Values } from "./service"
import type { LoyaltyValues } from "./schema"
import { loyaltyKeys, settingsKeys } from "./keys"
import { salesKeys } from "@/modules/sales/keys"

export const settingsKey = (branchId: number | null) => ["settings", branchId] as const

function useKey() {
  const branch = useBranchChoice((s) => s.branchId)
  return settingsKeys.app(branch)
}

/**
 * GET /Settings as the server sends it. Until the first answer the last one read (or `{}`) is used, so every reader
 * needs its own fallback; nothing is requested before the user is signed in, except on the customer's own ordering
 * screen (pos4), where the server hands them out without a sign-in.
 */
export const useAppSettingsQuery = () => {
  const signedIn = useAuthStore((s) => !!s.session)
  const publicScreen = location.pathname.replace(/\/+$/, "") === "/pos4"
  const key = useKey()
  return useQuery({ queryKey: key, queryFn: settingsApi.get, placeholderData: settingsApi.snapshot, staleTime: 60_000, enabled: signedIn || publicScreen })
}

export const useAppSettings = () => useAppSettingsQuery().data ?? settingsApi.snapshot()

/** Saves a form's changed fields (see `settingsApi.save`). */
export function useSaveTab() {
  const qc = useQueryClient()
  const key = useKey()
  return useMutation({
    mutationFn: ({ data, saved }: { data: Values; saved: Values }) => settingsApi.save(data, saved),
    onSuccess: (s) => {
      qc.setQueryData(key, s)
      toast.success(i18n.t("settings.saved"))
    },
    // A save can reach some groups before failing, so what the server holds now is read again.
    onError: (e) => { qc.invalidateQueries({ queryKey: key }); errorToast(e, "common.saveFailed") },
  })
}

/** GET /LoyaltyPoints (`null` = no record yet). */
export const useLoyaltyPoints = () => useQuery({ queryKey: loyaltyKeys.all, queryFn: loyaltyApi.get })

/** Saves the loyalty tab (see `loyaltyApi.save`); both reads are refreshed afterwards, whether it worked or not. */
export function useSaveLoyalty() {
  const qc = useQueryClient()
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: loyaltyKeys.all }), qc.invalidateQueries({ queryKey: settingsKeys.all })])
  return useMutation({
    mutationFn: ({ data, saved }: { data: LoyaltyValues; saved: LoyaltyValues }) => loyaltyApi.save(data, saved),
    onSuccess: async () => {
      await refresh()
      toast.success(i18n.t("settings.saved"))
    },
    onError: (e) => { refresh(); errorToast(e, "common.saveFailed") },
  })
}

export function useResendUnsent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsApi.resendUnsent,
    onSuccess: () => qc.invalidateQueries({ queryKey: salesKeys.all }),
  })
}
