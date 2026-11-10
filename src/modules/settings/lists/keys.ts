import type { ListSort } from "@/shared/api/errors"

export const deliverySettingsKeys = {
  all: ["settings-delivery"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-delivery", "list", sort] : ["settings-delivery", "list"]) as readonly unknown[],
}

export const currencyKeys = {
  all: ["settings-currencies"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-currencies", "list", sort] : ["settings-currencies", "list"]) as readonly unknown[],
}

export const taxSettingsKeys = {
  all: ["settings-taxes"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-taxes", "list", sort] : ["settings-taxes", "list"]) as readonly unknown[],
}

export const reasonKeys = {
  all: ["settings-reasons"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-reasons", "list", sort] : ["settings-reasons", "list"]) as readonly unknown[],
}

export const tableSettingsKeys = {
  all: ["settings-tables"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-tables", "list", sort] : ["settings-tables", "list"]) as readonly unknown[],
}

export const pricingKeys = {
  all: ["settings-pricing"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-pricing", "list", sort] : ["settings-pricing", "list"]) as readonly unknown[],
}

export const discountKeys = {
  all: ["settings-discounts"] as const,
  list: (sort?: ListSort) => (sort?.SortBy ? ["settings-discounts", "list", sort] : ["settings-discounts", "list"]) as readonly unknown[],
}
