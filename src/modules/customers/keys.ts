import type { ListSort } from "@/shared/api/errors"

export const customerKeys = {
  all: ["customers"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["customers", "list", sort] : ["customers", "list"]) as readonly unknown[],
  detail: (id: number) => ["customers", "detail", id] as const,
  refs: ["customers", "refs"] as const,
}
