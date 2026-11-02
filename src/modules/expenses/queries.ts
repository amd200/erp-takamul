import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { expenseItemsApi, expensesApi } from "./service"
import type { ExpenseInput } from "./types"

export const useExpenseItems = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["expense-items", "list", sort] : ["expense-items", "list"], queryFn: () => expenseItemsApi.list(sort), placeholderData: keepPreviousData })

export const useSaveExpenseItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof expenseItemsApi.create>[0] }) => (id ? expenseItemsApi.update(id, data) : expenseItemsApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-items"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteExpenseItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => expenseItemsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expense-items"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const expenseKeys = { all: ["expenses"] as const, list: ["expenses", "list"] as const }

export const useExpenses = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? [...expenseKeys.list, sort] : expenseKeys.list, queryFn: () => expensesApi.list(sort), placeholderData: keepPreviousData })

/** An expense moves money out of a treasury, so the balances refresh with the list. */
function useExpenseMutation<A>(fn: (a: A) => Promise<unknown>, ok: string, failed: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseKeys.all })
      qc.invalidateQueries({ queryKey: ["treasuries"] })
      toast.success(i18n.t(ok))
    },
    onError: (e) => errorToast(e, failed),
  })
}

export const useSaveExpense = () =>
  useExpenseMutation(({ id, data, key }: { id?: number; data: ExpenseInput; key?: string }) => (id ? expensesApi.update(id, data) : expensesApi.create(data, key)), "common.saved", "common.saveFailed")
export const useDeleteExpense = () => useExpenseMutation((id: number) => expensesApi.remove(id), "common.deleted", "common.deleteFailed")
