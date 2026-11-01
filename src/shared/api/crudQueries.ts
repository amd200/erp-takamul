import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { ApiError } from "@/shared/http/ApiError"

/** Server sort params, exactly as the endpoints name them. */
export type ListSort = { SortBy?: string; SortDescending?: boolean }

/** `R` is what create/update return: the record for mocks, often just `{ message }` from the server. */
type CrudApi<T, In, R = T> = {
  list: (sort?: ListSort) => Promise<T[]>
  get: (id: number) => Promise<T>
  create: (data: In) => Promise<R>
  update: (id: number, data: In) => Promise<R>
  remove: (id: number) => Promise<unknown>
}

/** The server's own message when it sent one (it's already in the user's language), else ours. */
export const errorToast = (e: unknown, fallbackKey: string) =>
  toast.error(e instanceof ApiError && e.status !== 0 && e.status < 500 ? e.message : e instanceof ApiError && e.isNetwork ? e.message : i18n.t(fallbackKey))

/** Standard list/get/save/delete hooks for a module. Saving or deleting refreshes the module's queries. */
export function createCrudQueries<T, In, R = T>(key: string, api: CrudApi<T, In, R>) {
  const keys = { all: [key] as const, list: (sort?: ListSort) => (sort?.SortBy ? [key, "list", sort] : [key, "list"]) as readonly unknown[], detail: (id: number) => [key, "detail", id] as const }

  const useList = (sort?: ListSort) => useQuery({ queryKey: keys.list(sort), queryFn: () => api.list(sort), placeholderData: keepPreviousData })
  const useDetail = (id: number | undefined) =>
    useQuery({ queryKey: keys.detail(id ?? 0), queryFn: () => api.get(id!), enabled: id != null })

  const useSave = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id?: number; data: In }) => (id ? api.update(id, data) : api.create(data)),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: keys.all })
        toast.success(i18n.t("common.saved"))
      },
      onError: (e) => errorToast(e, "common.saveFailed"),
    })
  }

  const useDelete = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.remove(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: keys.all })
        toast.success(i18n.t("common.deleted"))
      },
      onError: (e) => errorToast(e, "common.deleteFailed"),
    })
  }

  return { keys, useList, useDetail, useSave, useDelete }
}
