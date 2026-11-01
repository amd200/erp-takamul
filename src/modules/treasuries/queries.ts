import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { createCrudQueries, errorToast, type ListSort } from "@/shared/api/crudQueries"
import { treasuriesApi } from "./service"
import type { TransferInput } from "./types"

export const { keys: treasuryKeys, useList: useTreasuryList, useSave: useSaveTreasury, useDelete: useDeleteTreasury } = createCrudQueries("treasuries", treasuriesApi)

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
