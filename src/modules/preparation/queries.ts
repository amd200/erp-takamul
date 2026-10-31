import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/crudQueries"
import { preparationApi } from "./service"

const KEY = ["preparation"] as const

export const usePreparationOrders = (search: string) =>
  useQuery({ queryKey: [...KEY, "list", search], queryFn: () => preparationApi.list(search), refetchInterval: 5_000, placeholderData: (prev) => prev })

export function useMarkReady() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: preparationApi.markReady,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success(i18n.t("preparation.markedReady")) },
    onError: (e) => errorToast(e, "preparation.markFailed"),
  })
}
