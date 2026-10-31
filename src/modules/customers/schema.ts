import { z } from "zod"
import { emptyAddress } from "@/modules/partners/types"
import { partyShape, refineParty } from "@/modules/partners/schema"
import { EYE_FIELDS, type Companion, type Measurement } from "./types"

export const emptyMeasurement: Measurement = Object.fromEntries(EYE_FIELDS.map((k) => [k, ""])) as Measurement
export const emptyCompanion = (): Companion => ({ name: "", phone: "", ...emptyMeasurement })

const eyeShape = Object.fromEntries(EYE_FIELDS.map((k) => [k, z.string()])) as Record<(typeof EYE_FIELDS)[number], z.ZodString>

export const customerSchema = z.object({
  ...partyShape,
  fileNumber: z.string().trim(),
  ...eyeShape,
  companions: z.array(z.object({
    id: z.number().optional(),
    name: z.string().trim().min(1, "validation.companionNameRequired"),
    phone: z.string().trim(),
    ...eyeShape,
  })),
}).superRefine(refineParty)
export type CustomerForm = z.infer<typeof customerSchema>

export const emptyCustomer: CustomerForm = {
  ...emptyAddress, name: "", phone: "", email: "", isNational: true, taxNumber: "", commercialRegister: "",
  openingBalance: 0, openingBalanceType: "debit", openingBalanceDate: new Date().toISOString().slice(0, 10), isActive: true,
  fileNumber: "", ...emptyMeasurement, companions: [],
}
