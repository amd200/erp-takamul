import type { ListSort } from "@/shared/api/errors"

export const userKeys = {
  all: ["users"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["users", "list", sort] : ["users", "list"]) as readonly unknown[],
  roleNames: ["users", "role-names"] as const,
}
