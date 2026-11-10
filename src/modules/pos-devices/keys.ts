import type { ListSort } from "@/shared/api/errors"

export const deviceKeys = {
  all: ["pos-devices"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["pos-devices", "list", sort] : ["pos-devices", "list"]) as readonly unknown[],
  certificates: (sort?: ListSort) => (sort?.SortBy ? ["pos-devices", "certificates", sort] : ["pos-devices", "certificates"]) as readonly unknown[],
  expiring: ["pos-devices", "expiring"] as const,
}
