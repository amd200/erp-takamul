import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import type { PrepOrder } from "./types"

export const preparationApi = {
  /** The orders of the open shift, newest first, refreshed by the page every few seconds. */
  list: async (search: string) => {
    const res = await http<PagedResult<PrepOrder>>("/sales-orders", { params: { Page: 1, PageSize: 100, SearchTerm: search || undefined, CurrentShiftOnly: true, IsHold: false } })
    return res.items
  },
  markReady: (id: number) => http<unknown>(`/sales-orders/${id}/mark-ready`, { method: "POST" }),
}
