/** Settings belong to a branch, so the chosen branch is part of the key. */
export const settingsKeys = {
  all: ["settings"] as const,
  app: (branchId: number | null) => ["settings", branchId] as const,
}
