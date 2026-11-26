import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { branchesApi } from "./service"
import type { Branch, BranchInput } from "./types"
import { branchKeys } from "./keys"
import { refKeys } from "@/shared/api/keys"

export const useBranchList = () => useQuery({ queryKey: branchKeys.list, queryFn: branchesApi.list })
export const useBranch = (id: number | undefined) => useQuery({ queryKey: branchKeys.detail(id ?? 0), queryFn: () => branchesApi.get(id!), enabled: !!id })

export function useSaveBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, current }: { id?: number; data: BranchInput; current?: Branch }) => (id && current ? branchesApi.update(id, data, current) : branchesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.all })
      qc.invalidateQueries({ queryKey: refKeys.all })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export function useDeleteBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => branchesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.all })
      qc.invalidateQueries({ queryKey: refKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}
