export const purchaseKeys = {
  all: ["purchases"] as const,
  page: (q: object) => ["purchases", "page", q] as const,
  detail: (id: number) => ["purchases", "detail", id] as const,
  nextNumber: ["purchases", "next-number"] as const,
}
