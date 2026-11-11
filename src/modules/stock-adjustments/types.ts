/** Mirrors /StockInventory/bulk-adjustments. */
export type Operation = "Add" | "Remove"

/** An adjustment, as the server sends it: each item names the product, its barcode and unit, so no lookups are needed. */
export type AdjustmentItemDto = {
  id?: number; productId?: number | null; productName?: string | null; barcode?: string | null; unitId?: number | null; unitName?: string | null
  quantity?: number | null; quantityChanged?: number | null; quantityBefore?: number | null; quantityAfter?: number | null; operationType?: Operation | null
}
export type AdjustmentDto = { id: number; notes?: string | null; performedBy?: string | null; operationDate?: string | null; items?: AdjustmentItemDto[] | null }

/** One item in one warehouse, as GET /StockInventory sends it. */
export type StockRowDto = {
  id: number; productId: number; productName: string; barcode?: string | null
  warehouseId: number; warehouseName?: string | null; quantityAvailable: number
  productUnits?: { unitId: number; unitName?: string | null; isBaseUnit: boolean; barcode?: string | null }[] | null
}

export type AdjustmentInput = { date: string; notes: string; lines: { stockInventoryId: number; unitId: number | null; operation: Operation; quantity: number }[] }
