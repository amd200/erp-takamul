export const quoteKeys = {
  all: ["quotes"] as const,
  page: (q: object) => ["quotes", "page", q] as const,
  detail: (id: number) => ["quotes", "detail", id] as const,
  byNumber: (number: string) => ["quotations", "by-number", number] as const,
}
