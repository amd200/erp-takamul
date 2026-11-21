import { branchesApi } from "@/modules/branches/service"
import { ApiError } from "@/shared/http/ApiError"
import { http } from "@/shared/http/request"
import type { Shift, ShiftListResponse, ShiftReport, OpenShiftInput, ShiftEmployee, ShiftDevice } from "./types"

const pad = (v: number) => String(v).padStart(2, "0")
const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

export const shiftsApi = {
  list: () => http<ShiftListResponse>("/Shifts"),

  // The form's branch travels as X-Branch-Id (it wins over the header selection), not in the body.
  open: ({ branchId, ...v }: OpenShiftInput) => {
    const now = new Date()
    return http<unknown>("/Shifts/open", { method: "POST", headers: { "X-Branch-Id": String(branchId) }, data: { ...v, shiftDate: localDay(now), startTime: localTime(now) } })
  },

  close: (shiftId: number) => {
    const now = new Date()
    return http<unknown>("/Shifts/close", { method: "POST", data: { shiftId, endDate: localDay(now), endTime: localTime(now) } })
  },

  report: (id: number) => http<ShiftReport>(`/Shifts/${id}/report`),

  export: (id: number) => http<Blob>(`/Shifts/${id}/export`, { responseType: "blob" }),

  // Pick-lists for the "open a shift" form, as the server sends them.
  branches: async () => (await branchesApi.list()).filter((b) => b.isActive !== false),
  employees: (branchId: number) => http<{ data: ShiftEmployee[] }>(`/Shifts/EmployeeBybranch/${branchId}`).then((r) => r.data),
  devices: () => http<{ data: ShiftDevice[] }>("/pos-devices").then((r) => r.data),
}

/** The shift the signed-in cashier has open right now, or null when there is none. */
export async function currentShift(): Promise<Shift | null> {
  try {
    const { data } = await http<{ data: Shift | null }>("/Shifts/open-shift")
    return data
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}
