import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { createCrudQueries, errorToast } from "@/shared/api/crudQueries"
import { treasuriesApi } from "./service"
import type { TransferInput } from "./types"

export const { keys: treasuryKeys, useList: useTreasuryList, useSave: useSaveTreasury, useDelete: useDeleteTreasury } = createCrudQueries("treasuries", treasuriesApi)

export const useStatement = (treasuryId: number | undefined, from: string, to: string) =>
  useQuery({ queryKey: ["treasuries", "statement", treasuryId, from, to], queryFn: () => treasuriesApi.statement(treasuryId!, from, to), enabled: !!treasuryId })
export const useTransferList = () => useQuery({ queryKey: ["treasuries", "transfers"], queryFn: treasuriesApi.transfers })

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
