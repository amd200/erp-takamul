import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { preparationApi } from "./service"
import { preparationKeys } from "./keys"

export const usePreparationOrders = (search: string) =>
  useQuery({ queryKey: preparationKeys.list(search), queryFn: () => preparationApi.list(search), refetchInterval: 5_000, placeholderData: (prev) => prev })

export function useMarkReady() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: preparationApi.markReady,
    onSuccess: () => { qc.invalidateQueries({ queryKey: preparationKeys.all }); toast.success(i18n.t("preparation.markedReady")) },
    onError: (e) => errorToast(e, "preparation.markFailed"),
  })
}
