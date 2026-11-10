export const reportKeys = {
  customerMovement: (p: unknown) => ["reports", "customer-movement", p] as const,
  report: (id: string, filters: unknown) => ["reports", id, filters] as const,
  oldReport: (id: unknown, applied: unknown, dep: unknown, sort: unknown, page: unknown, size: unknown) => ["old-reports", id, applied, dep, sort, page, size] as const,
  netSales: (params: unknown, sort: unknown, page: unknown, size: unknown) => ["old-reports", "net-sales", params, sort, page, size] as const,
}
