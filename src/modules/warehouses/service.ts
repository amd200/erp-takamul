import { http } from "@/shared/http/request"
import { currentBranchId } from "@/modules/partners/mappers"
import type { Warehouse, WarehouseInput } from "./types"

const blank = (s: string) => s.trim() || null

export const warehousesApi = {
  list: async () => {
    const res = await http<Warehouse[] | { data?: Warehouse[] }>("/Warehouse")
    return Array.isArray(res) ? res : res?.data ?? []
  },
  get: (id: number) => http<Warehouse>(`/Warehouse/${id}`),
  create: (w: WarehouseInput) => http<unknown>("/Warehouse", { method: "POST", data: { warehouseCode: w.warehouseCode, warehouseName: w.warehouseName, address: blank(w.address), branchId: currentBranchId() } }),
  // The update body takes no code: it is fixed once the warehouse exists.
  update: (id: number, w: WarehouseInput) => http<unknown>(`/Warehouse/${id}`, { method: "PUT", data: { warehouseName: w.warehouseName, address: blank(w.address), city: blank(w.city), state: blank(w.state), capacity: w.capacity ?? null } }),
  remove: (id: number) => http<unknown>(`/Warehouse/${id}`, { method: "DELETE" }),
}
