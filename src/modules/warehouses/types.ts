/** Warehouse response fields, preserved as returned by /Warehouse. */
export type Warehouse = {
  id: number
  warehouseCode?: string | null
  warehouseName?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  capacity?: number | null
  managerName?: string | null
  isActive?: boolean | null
}

/** Form values; empty text is converted to null when building the request. */
export type WarehouseInput = {
  warehouseCode: string
  warehouseName: string
  address: string
  city: string
  state: string
  capacity?: number | null
}
