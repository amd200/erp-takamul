import type { ListSort } from "@/shared/api/errors"

export const employeeKeys = {
  all: ["employees"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["employees", "list", sort] : ["employees", "list"]) as readonly unknown[],
  refs: ["employees", "refs"] as const,
}
