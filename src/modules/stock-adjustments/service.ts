import { fetchAllPages } from "@/shared/http/paged"
import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { productsApi } from "@/modules/products/service"
import type { AdjustmentDto, AdjustmentInput } from "./types"

type StockRowDto = { id: number; productId: number; warehouseId: number; quantityAvailable: number }

/** The stock row (item in a warehouse) the server adjusts; an item held in several warehouses is adjusted in the first. */
async function stockRowOf(productId: number, barcode: string) {
  const res = await http<{ items: StockRowDto[] }>("/StockInventory", { params: { Page: 1, PageSize: 50, SearchTerm: barcode || undefined } })
  const row = res.items.find((r) => r.productId === productId)
  if (!row) throw new Error("no-stock-row")
  return row
}

// Real endpoints: GET /StockInventory/bulk-adjustments, GET /StockInventory/{id}, POST /StockInventory/bulk-adjust
export const adjustmentsApi = {
  list: async (sort?: ListSort) => {
    const rows = await fetchAllPages<AdjustmentDto>("/StockInventory/bulk-adjustments", { pageSize: 50, params: { ...sort } })
    // Newest first unless the user picked a sort.
    return sort?.SortBy ? rows : rows.sort((a, b) => b.id - a.id)
  },
  get: (id: number) => http<AdjustmentDto>(`/StockInventory/${id}`),
  create: async (input: AdjustmentInput) => {
    // The server adjusts stock rows, not items: each item is looked up for its row and its base unit.
    const items = await Promise.all(input.lines.map(async (l) => {
      const product = await productsApi.get(l.productId)
      const row = await stockRowOf(product.id, product.barcode ?? "")
      return { stockInventoryId: row.id, unitId: product.baseUnitId || null, operationType: l.operation, quantity: l.quantity }
    }))
    return http<unknown>("/StockInventory/bulk-adjust", { method: "POST", data: { notes: input.notes || null, items } })
  },
}
