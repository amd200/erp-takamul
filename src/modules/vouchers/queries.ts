import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { vouchersApi } from "./service"
import type { Voucher, VoucherInput } from "./types"
import { voucherKeys } from "./keys"
import { customerKeys } from "@/modules/customers/keys"
import { supplierKeys } from "@/modules/suppliers/keys"
import { treasuryKeys } from "@/modules/treasuries/keys"

export const useVouchers = (sort?: ListSort) => useQuery({ queryKey: voucherKeys.list(sort), queryFn: () => vouchersApi.list(sort), placeholderData: keepPreviousData })

/** A voucher changes party balances and treasury balances, so all three refresh. */
function useVoucherMutation<A>(fn: (a: A) => Promise<unknown>, ok: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const queryKey of [voucherKeys.all, customerKeys.all, supplierKeys.all, treasuryKeys.all]) qc.invalidateQueries({ queryKey })
      toast.success(i18n.t(ok))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useCreateVoucher = () => useVoucherMutation((v: VoucherInput) => vouchersApi.create(v), "vouchers.saved")
export const useDeleteVoucher = () => useVoucherMutation((v: Pick<Voucher, "id" | "kind">) => vouchersApi.remove(v), "common.deleted")
