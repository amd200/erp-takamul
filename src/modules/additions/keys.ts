import type { ListSort } from "@/shared/api/errors"

export const additionKeys = {
  all: ["additions"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["additions", "list", sort] : ["additions", "list"]) as readonly unknown[],
  page: (q: unknown) => ["additions", "page", q] as const,
}
