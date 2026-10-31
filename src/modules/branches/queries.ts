import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { branchesApi } from "./service"
import type { Branch, BranchInput, BranchQuery } from "./types"

export const branchKeys = { all: ["branches"] as const, list: ["branches", "list"] as const, page: (q: BranchQuery) => ["branches", "page", q] as const, detail: (id: number) => ["branches", "detail", id] as const }

export const useBranchPage = (q: BranchQuery) => useQuery({ queryKey: branchKeys.page(q), queryFn: () => branchesApi.page(q), placeholderData: keepPreviousData })

export const useBranchList = () => useQuery({ queryKey: branchKeys.list, queryFn: branchesApi.list })
export const useBranch = (id: number | undefined) => useQuery({ queryKey: branchKeys.detail(id ?? 0), queryFn: () => branchesApi.get(id!), enabled: !!id })

export function useSaveBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, current }: { id?: number; data: BranchInput; current?: Branch }) => (id && current ? branchesApi.update(id, data, current) : branchesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: branchKeys.all })
      qc.invalidateQueries({ queryKey: ["refs"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}
