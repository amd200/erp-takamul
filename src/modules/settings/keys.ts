/** Settings belong to a branch, so the chosen branch is part of the key. */
export const settingsKeys = {
  all: ["settings"] as const,
  app: (branchId: number | null) => ["settings", branchId] as const,
}

/** The loyalty program's record (GET /LoyaltyPoints), read for the chosen branch (sent as X-Branch-Id). */
export const loyaltyKeys = {
  all: ["loyalty-points"] as const,
  detail: (branchId: number | null) => ["loyalty-points", branchId] as const,
}
