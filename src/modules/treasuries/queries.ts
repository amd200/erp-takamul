import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { treasuriesApi } from "./service"
import type { TransferInput } from "./types"
import { treasuryKeys } from "./keys"

export const useTreasuryList = (sort?: ListSort) => useQuery({ queryKey: treasuryKeys.list(sort), queryFn: () => treasuriesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveTreasury = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof treasuriesApi.create>[0] }) => (id ? treasuriesApi.update(id, data) : treasuriesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: treasuryKeys.all })
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
      qc.invalidateQueries({ queryKey: treasuryKeys.all })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useStatement = (treasuryId: number | undefined, from: string, to: string, sort?: ListSort) =>
  useQuery({ queryKey: treasuryKeys.statement(treasuryId, from, to, sort), queryFn: () => treasuriesApi.statement(treasuryId!, from, to, sort), enabled: !!treasuryId })
export const useTransferList = (sort?: ListSort) => useQuery({ queryKey: treasuryKeys.transfers(sort), queryFn: () => treasuriesApi.transfers(sort), placeholderData: keepPreviousData })

function useTreasuryMutation<A>(fn: (a: A) => Promise<unknown>, ok: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: treasuryKeys.all }); toast.success(i18n.t(ok)) },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useTransfer = () => useTreasuryMutation((t: TransferInput) => treasuriesApi.transfer(t), "treasuries.transferred")
export const useDeleteTransfer = () => useTreasuryMutation((id: number) => treasuriesApi.deleteTransfer(id), "common.deleted")
export const useCashMove = () => useTreasuryMutation(treasuriesApi.cashMove, "common.saved")
