export const roleKeys = {
  all: ["roles"] as const,
  list: ["roles", "list"] as const,
  detail: (id: string) => ["roles", "detail", id] as const,
}
