import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ApiError } from "@/shared/http/ApiError"
import { publicInvoiceKeys } from "./keys"
import { isFinalized, publicInvoiceApi, type FollowedRecord } from "./service"

const POLL_MS = 4000

/** The record this visitor follows, polled until it is a final invoice, so the page updates without a push. */
export const useLastInvoice = (branchId: string | undefined, target: FollowedRecord | null) => useQuery({
  queryKey: publicInvoiceKeys.last(branchId, target),
  queryFn: () => publicInvoiceApi.last(branchId, target ?? undefined),
  retry: false,
  placeholderData: keepPreviousData,
  refetchInterval: (q) => (q.state.status === "error" || (q.state.data && isFinalized(q.state.data)) ? false : POLL_MS),
})

/** The cashier's "send notification" button on a completed invoice. */
export function useSendInvoiceNotification() {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: publicInvoiceApi.send,
    onSuccess: () => toast.success(t("invTrack.sent")),
    onError: (e) => (e instanceof ApiError && e.status === 404 ? toast.info(t("invTrack.noDevice")) : toast.error(t("invTrack.sendFailed"))),
  })
}
