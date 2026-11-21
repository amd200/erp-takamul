export const BOOKING_STATUSES = ["Confirmed", "Deferred", "Cancelled"] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/** Mirrors BookingResponseDto, as GET /api/bookings sends it. */
export type Reservation = {
  id: number
  branchId: number
  /** The backend sends no branch name, only branchId. */
  branchName?: string | null
  bookingNumber: string
  customerId: number | null
  customerName: string
  customerPhone: string
  bookingDate: string
  /** HH:mm:ss as the booking was entered. */
  bookingTime: string
  /** The moment of the booking (date and time together). */
  bookingDateTime: string
  status: BookingStatus
  notes: string | null
  createdAt: string
  createdBy: string | null
}

export type ReservationInput = { customerName: string; customerPhone: string; date: string; time: string; status: BookingStatus; notes: string; customerId: number | null }

export type ReservationQuery = { status?: BookingStatus; dateFrom?: string; dateTo?: string; search?: string; sortBy?: string; sortDescending?: boolean }

/** A booking with no status yet is a confirmed one. */
export const bookingStatusOf = (status: string | null | undefined): BookingStatus => (BOOKING_STATUSES as readonly string[]).includes(status ?? "") ? (status as BookingStatus) : "Confirmed"
