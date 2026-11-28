/** Settings belong to a branch, so the chosen branch is part of the key. */
export const settingsKeys = {
  all: ["settings"] as const,
  app: (branchId: number | null) => ["settings", branchId] as const,
}

/** The loyalty program's one record (GET /LoyaltyPoints). */
export const loyaltyKeys = {
  all: ["loyalty-points"] as const,
}
