export const salesKeys = {
  all: ["sales"] as const,
  invoices: ["sales", "invoices"] as const,
  invoice: (id: number) => ["sales", "invoices", id] as const,
  invoicePayments: (id: number) => ["sales", "invoices", id, "payments"] as const,
  nextPosNumber: ["sales", "invoices", "next-pos"] as const,
  returns: ["sales", "returns"] as const,
  debitNotes: ["sales", "debit-notes"] as const,
  posTables: ["sales", "pos-tables"] as const,
  posLatest: ["sales", "pos-latest"] as const,
  posInvoices: (tab: string) => ["sales", "pos2-invoices", tab] as const,
}

export const categoryDiscountKeys = {
  active: ["category-discounts", "active"] as const,
}
