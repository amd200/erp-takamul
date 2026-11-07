import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { quotesApi } from "./service"
import type { QuoteInput } from "./types"

export const quoteKeys = { all: ["quotes"] as const, page: (q: object) => ["quotes", "page", q] as const, detail: (id: number) => ["quotes", "detail", id] as const }
export const quoteDetailOptions = (id: number) => queryOptions({ queryKey: quoteKeys.detail(id), queryFn: () => quotesApi.get(id) })

export const useQuotePage = (q: { page: number; pageSize: number; searchTerm?: string; sortBy?: string; sortDescending?: boolean }) =>
  useQuery({ queryKey: quoteKeys.page(q), queryFn: () => quotesApi.page(q), placeholderData: keepPreviousData })
export const useQuote = (id: number | undefined) => useQuery({ ...quoteDetailOptions(id ?? 0), enabled: !!id })

function useQuoteMutation<A>(fn: (a: A) => Promise<unknown>, ok: string, fail = "common.saveFailed") {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: quoteKeys.all }); toast.success(i18n.t(ok)) },
    onError: (e) => errorToast(e, fail),
  })
}

export const useSaveQuote = () => useQuoteMutation(({ id, data, key }: { id?: number; data: QuoteInput; key?: string }) => (id ? quotesApi.update(id, data) : quotesApi.create(data, key)), "common.saved")
export const useDeleteQuote = () => useQuoteMutation((id: number) => quotesApi.remove(id), "common.deleted", "common.deleteFailed")
export const useDuplicateQuote = () => useQuoteMutation(({ id, key }: { id: number; key?: string }) => quotesApi.duplicate(id, key), "quotes.duplicated")
