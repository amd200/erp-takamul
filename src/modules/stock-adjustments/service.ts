import { fetchAllPages } from "@/shared/http/paged"
import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import type { AdjustmentDto, AdjustmentInput, StockRowDto } from "./types"

/** The body create (POST bulk-adjust) and update (PUT /{id}) share. */
const bodyOf = (input: AdjustmentInput) => ({
  // The server currently stamps its own time; the chosen date is sent so it is used once the endpoint accepts it.
  operationDate: input.date || undefined,
  notes: input.notes || null,
  items: input.lines.map((l) => ({ stockInventoryId: l.stockInventoryId, unitId: l.unitId, operationType: l.operation, quantity: l.quantity })),
})

// Real endpoints: GET /StockInventory (item per warehouse), GET /StockInventory/bulk-adjustments, GET /StockInventory/{id}, POST /StockInventory/bulk-adjust, PUT /StockInventory/{id}, DELETE /StockInventory/{id}
export const adjustmentsApi = {
  list: async (sort?: ListSort) => {
    const rows = await fetchAllPages<AdjustmentDto>("/StockInventory/bulk-adjustments", { pageSize: 50, params: { ...sort } })
    // Newest first unless the user picked a sort.
    return sort?.SortBy ? rows : rows.sort((a, b) => b.id - a.id)
  },
  get: (id: number) => http<AdjustmentDto>(`/StockInventory/${id}`),
  /** Items per warehouse matching a typed name or code (the server searches name, barcode and warehouse). */
  stock: async (term: string) => (await http<PagedResult<StockRowDto>>("/StockInventory", { params: { Page: 1, PageSize: 30, SearchTerm: term || undefined } })).items,
  update: (id: number, input: AdjustmentInput) => http<unknown>(`/StockInventory/${id}`, { method: "PUT", data: bodyOf(input) }),
  remove: (id: number) => http(`/StockInventory/${id}`, { method: "DELETE" }),
  create: (input: AdjustmentInput) => http<unknown>("/StockInventory/bulk-adjust", { method: "POST", data: bodyOf(input) }),
}
