import type { ListSort } from "@/shared/api/errors"

export const unitKeys = {
  all: ["units"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["units", "list", sort] : ["units", "list"]) as readonly unknown[],
}
