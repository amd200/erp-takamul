import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { ApiError } from "@/shared/http/ApiError"

/** Server sort params, exactly as the endpoints name them. */
export type ListSort = { SortBy?: string; SortDescending?: boolean }

/** The server's own message (it's already in the user's language), followed by the first detail line it sent with it when that adds something, else ours. */
export const errorToast = (e: unknown, fallbackKey: string) => {
  if (e instanceof ApiError && e.status !== 0 && e.status < 500) {
    const detail = e.errors.find((x) => x !== e.message)
    toast.error(detail ? `${e.message}: ${detail}` : e.message)
    return
  }
  toast.error(e instanceof ApiError && e.isNetwork ? e.message : i18n.t(fallbackKey))
}
