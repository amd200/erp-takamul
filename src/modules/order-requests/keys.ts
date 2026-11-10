export const orderRequestKeys = {
  all: ["order-requests"] as const,
  page: (q: object) => ["order-requests", "page", q] as const,
  detail: (id: number) => ["order-requests", "detail", id] as const,
}
