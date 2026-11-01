export const BOOKING_STATUSES = ["Confirmed", "Deferred", "Cancelled"] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/** Mirrors /bookings, as the server sends it. */
export type Reservation = {
  id: number
  bookingNumber?: string | null
  customerId?: number | null
  customerName?: string | null
  customerPhone?: string | null
  bookingDate?: string | null
  /** HH:mm:ss as the booking was entered. */
  bookingTime?: string | null
  /** The moment of the booking (date and time together). */
  bookingDateTime?: string | null
  status?: string | null
  notes?: string | null
  branchName?: string | null
  createdBy?: string | null
}

export type ReservationInput = { customerName: string; customerPhone: string; date: string; time: string; status: BookingStatus; notes: string; customerId: number | null }

export type ReservationQuery = { status?: BookingStatus; dateFrom?: string; dateTo?: string; search?: string; sortBy?: string; sortDescending?: boolean }

/** A booking with no status yet is a confirmed one. */
export const bookingStatusOf = (status: string | null | undefined): BookingStatus => (BOOKING_STATUSES as readonly string[]).includes(status ?? "") ? (status as BookingStatus) : "Confirmed"
