import { z } from "zod"
import type { Warehouse } from "./types"

export const warehouseSchema = z.object({
  warehouseCode: z.string().trim().min(1, "validation.codeRequired"),
  warehouseName: z.string().trim().min(1, "validation.nameRequired"),
  address: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  capacity: z.number({ error: "validation.number" }).min(0, "validation.min0").nullish(),
})
export type WarehouseForm = z.infer<typeof warehouseSchema>
export const emptyWarehouse: WarehouseForm = { warehouseCode: "", warehouseName: "", address: "", city: "", state: "", capacity: null }

/** Only form controls receive empty strings; cached API data stays unchanged. */
export const warehouseFormValues = (warehouse: Warehouse): WarehouseForm => ({
  warehouseCode: warehouse.warehouseCode ?? "",
  warehouseName: warehouse.warehouseName ?? "",
  address: warehouse.address ?? "",
  city: warehouse.city ?? "",
  state: warehouse.state ?? "",
  capacity: warehouse.capacity ?? null,
})
