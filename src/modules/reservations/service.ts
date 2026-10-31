import { http } from "@/shared/http/request"
import { currentBranchId } from "@/modules/partners/mappers"
import type { BookingStatus, Reservation, ReservationInput, ReservationQuery } from "./types"


/** The server wants the day as a moment and the time on its own. */
const body = (r: ReservationInput) => ({
  customerName: r.customerName, customerPhone: r.customerPhone, bookingDate: new Date(`${r.date}T${r.time}:00`).toISOString(), bookingTime: r.time,
  status: r.status, notes: r.notes || null, customerId: r.customerId,
})

export const reservationsApi = {
  list: async (q: ReservationQuery) => {
    const res = await http<Reservation[] | { data?: Reservation[] }>("/bookings", { params: { status: q.status, dateFrom: q.dateFrom || undefined, dateTo: q.dateTo || undefined, search: q.search || undefined } })
    return Array.isArray(res) ? res : res?.data ?? []
  },
  create: (r: ReservationInput) => http<unknown>("/bookings", { method: "POST", data: { ...body(r), branchId: currentBranchId() } }),
  update: (id: number, r: ReservationInput) => http<unknown>(`/bookings/${id}`, { method: "PUT", data: body(r) }),
  setStatus: (id: number, status: BookingStatus) => http<unknown>(`/bookings/${id}/status`, { method: "PATCH", data: { status } }),
  remove: (id: number) => http<unknown>(`/bookings/${id}`, { method: "DELETE" }),
}
