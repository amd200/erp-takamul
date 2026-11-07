import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { useAuthStore, useBranchChoice } from "@/shared/auth/authStore"
import { settingsApi, type Values } from "./service"

/** Settings belong to a branch, so the chosen branch is part of the key. */
export const settingsKey = (branchId: number | null) => ["settings", branchId] as const

function useKey() {
  const branch = useBranchChoice((s) => s.branchId)
  return settingsKey(branch)
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

export function useResendUnsent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: settingsApi.resendUnsent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  })
}
