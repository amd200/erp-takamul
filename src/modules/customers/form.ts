import { partyFormOf } from "@/modules/partners/mappers"
import { EYE_FIELDS, type Companion, type CompanionDto, type Customer, type CustomerInput, type EyeDto, type Measurement } from "./types"

export const eyeText = (d: EyeDto): Measurement => Object.fromEntries(EYE_FIELDS.map((k) => [k, d[k] == null ? "" : String(d[k])])) as Measurement
const companionForm = (c: CompanionDto): Companion => ({ id: c.id, name: c.name ?? "", phone: c.phone ?? "", ...eyeText(c) })

/** What the customer form starts with when a saved customer is opened: the server's numbers become the text the boxes hold. */
export const customerFormOf = (d: Customer): CustomerInput => ({
  name: d.customerName ?? "", ...partyFormOf(d, "debit"), fileNumber: d.fileNumber ?? "", ...eyeText(d), companions: (d.companions ?? []).map(companionForm),
})
