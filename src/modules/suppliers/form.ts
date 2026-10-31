import { partyFormOf } from "@/modules/partners/mappers"
import type { Supplier, SupplierInput } from "./types"

/** What the supplier form starts with when a saved supplier is opened. */
export const supplierFormOf = (d: Supplier): SupplierInput => ({ name: d.supplierName ?? "", paymentTerms: d.paymentTerms ?? 0, ...partyFormOf(d, "credit") })
