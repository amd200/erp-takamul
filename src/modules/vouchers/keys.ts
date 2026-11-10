import type { ListSort } from "@/shared/api/errors"

export const voucherKeys = {
  all: ["vouchers"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["vouchers", sort] : ["vouchers"]) as readonly unknown[],
}
