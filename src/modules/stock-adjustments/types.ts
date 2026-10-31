/** Mirrors /StockInventory/bulk-adjustments. */
export type Operation = "Add" | "Remove"

/** An adjustment, as the server sends it: each item names the product, its barcode and unit, so no lookups are needed. */
export type AdjustmentItemDto = {
  id?: number; productId?: number | null; productName?: string | null; barcode?: string | null; unitId?: number | null; unitName?: string | null
  quantity?: number | null; quantityChanged?: number | null; quantityBefore?: number | null; quantityAfter?: number | null; operationType?: Operation | null
}
export type AdjustmentDto = { id: number; notes?: string | null; performedBy?: string | null; operationDate?: string | null; items?: AdjustmentItemDto[] | null }

export type AdjustmentInput = { notes: string; lines: { productId: number; operation: Operation; quantity: number }[] }
