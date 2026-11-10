import type { ListSort } from "@/shared/api/errors"

export const categoryKeys = {
  all: ["categories"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["categories", "list", sort] : ["categories", "list"]) as readonly unknown[],
}
