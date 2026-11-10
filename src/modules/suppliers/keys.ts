import type { ListSort } from "@/shared/api/errors"

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["suppliers", "list", sort] : ["suppliers", "list"]) as readonly unknown[],
  detail: (id: number) => ["suppliers", "detail", id] as const,
  refs: ["suppliers", "refs"] as const,
}
