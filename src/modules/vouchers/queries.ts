import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/crudQueries"
import { vouchersApi } from "./service"
import type { Voucher, VoucherInput } from "./types"

export const useVouchers = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["vouchers", sort] : ["vouchers"], queryFn: () => vouchersApi.list(sort), placeholderData: keepPreviousData })

/** A voucher changes party balances and treasury balances, so all three refresh. */
function useVoucherMutation<A>(fn: (a: A) => Promise<unknown>, ok: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ["vouchers", "customers", "suppliers", "treasuries"]) qc.invalidateQueries({ queryKey: [key] })
      toast.success(i18n.t(ok))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useCreateVoucher = () => useVoucherMutation((v: VoucherInput) => vouchersApi.create(v), "vouchers.saved")
export const useDeleteVoucher = () => useVoucherMutation((v: Pick<Voucher, "id" | "kind">) => vouchersApi.remove(v), "common.deleted")
