export const publicInvoiceKeys = {
  last: (branchId: unknown, lockedId: unknown) => ["public-last-invoice", branchId, lockedId] as const,
}
