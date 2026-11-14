export const publicInvoiceKeys = {
  last: (branchId: unknown, target: unknown) => ["public-last-invoice", branchId, target] as const,
}
