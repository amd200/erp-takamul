import type { ListSort } from "@/shared/api/errors"

export const expenseKeys = {
  all: ["expenses"] as const,
  list: ["expenses", "list"] as const,
}

export const expenseItemKeys = {
  all: ["expense-items"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["expense-items", "list", sort] : ["expense-items", "list"]) as readonly unknown[],
  refs: ["expense-items", "refs"] as const,
}
