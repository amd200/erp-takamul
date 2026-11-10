import type { ReservationQuery } from "./types"

export const reservationKeys = {
  all: ["reservations"] as const,
  list: (q: ReservationQuery) => ["reservations", "list", q] as const,
}
