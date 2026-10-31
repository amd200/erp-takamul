import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { currentBranchId, partyToBody } from "@/modules/partners/mappers"
import { EYE_FIELDS, TEXT_EYE_FIELDS, type Customer, type CustomerInput, type Measurement } from "./types"

// The server stores the measurements as numbers; an empty or unreadable box is sent as null.
const eyeToBody = (m: Measurement) => Object.fromEntries(EYE_FIELDS.map((k) => {
  if (TEXT_EYE_FIELDS.includes(k)) return [k, m[k].trim() || null]
  const n = m[k].trim() === "" ? NaN : Number(m[k])
  return [k, Number.isFinite(n) ? n : null]
}))

// The server has no customer e-mail or active flag; deleting is what deactivates.
const body = (c: CustomerInput) => ({
  customerName: c.name, ...partyToBody(c), fileNumber: c.fileNumber.trim() || null, ...eyeToBody(c),
  companions: c.companions.map((k) => ({ ...(k.id ? { id: k.id } : {}), name: k.name, phone: k.phone.trim() || null, ...eyeToBody(k) })),
})

export const customersApi = {
  list: () => fetchAllPages<Customer>("/Customer", { pageSize: 100 }),
  get: (id: number) => http<Customer>(`/Customer/${id}`),
  create: (data: CustomerInput) => http<unknown>("/Customer", { method: "POST", data: { ...body(data), branchId: currentBranchId() } }),
  update: (id: number, data: CustomerInput) => http<unknown>(`/Customer/${id}`, { method: "PUT", data: body(data) }),
  remove: (id: number) => http<unknown>(`/Customer/${id}`, { method: "DELETE" }),
}
