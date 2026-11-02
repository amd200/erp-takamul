import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { ApiError } from "@/shared/http/ApiError"

/** Server sort params, exactly as the endpoints name them. */
export type ListSort = { SortBy?: string; SortDescending?: boolean }

/** The server's own message when it sent one (it's already in the user's language), else ours. */
export const errorToast = (e: unknown, fallbackKey: string) =>
  toast.error(e instanceof ApiError && e.status !== 0 && e.status < 500 ? e.message : e instanceof ApiError && e.isNetwork ? e.message : i18n.t(fallbackKey))
