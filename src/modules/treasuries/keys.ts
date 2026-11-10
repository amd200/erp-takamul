import type { ListSort } from "@/shared/api/errors"

export const treasuryKeys = {
  all: ["treasuries"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["treasuries", "list", sort] : ["treasuries", "list"]) as readonly unknown[],
  refs: ["treasuries", "refs"] as const,
  statement: (treasuryId: number | undefined, from: string, to: string, sort?: ListSort) =>
    ["treasuries", "statement", treasuryId, from, to, sort?.SortBy, sort?.SortDescending] as const,
  transfers: (sort?: ListSort) => (sort?.SortBy ? ["treasuries", "transfers", sort] : ["treasuries", "transfers"]) as readonly unknown[],
}
