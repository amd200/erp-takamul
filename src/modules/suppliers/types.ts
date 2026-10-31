import type { PartyBase, PartyDto } from "@/modules/partners/types"

/** Mirrors /Suppliers, as the server sends it. balance > 0 means we owe the supplier. */
export type Supplier = PartyDto & { id: number; supplierCode?: number | null; supplierName: string; paymentTerms?: number | null }

/** What the add / edit form holds. */
export type SupplierInput = Omit<PartyBase, "id" | "code"> & { paymentTerms: number }
