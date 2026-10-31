import { z } from "zod"
import { BOOKING_STATUSES } from "./types"

export const reservationSchema = z.object({
  customerName: z.string().trim().min(1, "validation.nameRequired"),
  customerPhone: z.string().trim().min(1, "validation.phoneRequired").regex(/^\d+$/, "validation.digitsOnly"),
  date: z.string().min(1, "validation.dateRequired"),
  time: z.string().min(1, "validation.timeRequired"),
  status: z.enum(BOOKING_STATUSES),
  notes: z.string().trim(),
  customerId: z.number().nullable(),
})
export type ReservationForm = z.infer<typeof reservationSchema>

export const emptyReservation = (): ReservationForm => ({ customerName: "", customerPhone: "", date: new Date().toISOString().slice(0, 10), time: "20:00", status: "Confirmed", notes: "", customerId: null })
