import type { PartyDto } from "@/modules/partners/types"

/** Mirrors /Suppliers, as the server sends it. balance > 0 means we owe the supplier. */
export type Supplier = PartyDto & { id: number; supplierName: string; email?: string | null; paymentTerms?: number }
