export const pos4Keys = {
  branch: ["pos4", "branch"] as const,
  categories: ["pos4", "categories"] as const,
  items: ["pos4", "items"] as const,
  branched: (id: number | null) => ["pos4", "branched", id] as const,
}
