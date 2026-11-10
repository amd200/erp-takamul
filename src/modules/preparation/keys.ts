export const preparationKeys = {
  all: ["preparation"] as const,
  list: (search: string) => ["preparation", "list", search] as const,
}
