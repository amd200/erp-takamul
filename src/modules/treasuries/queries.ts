import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { treasuriesApi } from "./service"
import type { TransferInput } from "./types"

export const useTreasuryList = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["treasuries", "list", sort] : ["treasuries", "list"], queryFn: () => treasuriesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTreasury = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof treasuriesApi.create>[0] }) => (id ? treasuriesApi.update(id, data) : treasuriesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treasuries"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteTreasury = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => treasuriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treasuries"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useStatement = (treasuryId: number | undefined, from: string, to: string, sort?: ListSort) =>
  useQuery({ queryKey: ["treasuries", "statement", treasuryId, from, to, sort?.SortBy, sort?.SortDescending], queryFn: () => treasuriesApi.statement(treasuryId!, from, to, sort), enabled: !!treasuryId })
export const useTransferList = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["treasuries", "transfers", sort] : ["treasuries", "transfers"], queryFn: () => treasuriesApi.transfers(sort), placeholderData: keepPreviousData })

function useTreasuryMutation<A>(fn: (a: A) => Promise<unknown>, ok: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["treasuries"] }); toast.success(i18n.t(ok)) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useTransfer = () => useTreasuryMutation((t: TransferInput) => treasuriesApi.transfer(t), "treasuries.transferred")
export const useDeleteTransfer = () => useTreasuryMutation((id: number) => treasuriesApi.deleteTransfer(id), "common.deleted")
export const useCashMove = () => useTreasuryMutation(treasuriesApi.cashMove, "common.saved")
