import { z } from "zod"
import { partyShape, refineParty } from "@/modules/partners/schema"
import { EYE_FIELDS, type Companion, type Measurement } from "./types"

export const emptyMeasurement: Measurement = Object.fromEntries(EYE_FIELDS.map((k) => [k, ""])) as Measurement
export const emptyCompanion = (): Companion => ({ name: "", phone: "", ...emptyMeasurement })

const eye = z.string().nullish()

/** The add / edit form holds the server's own field names (CreateCustomerDto / UpdateCustomerDto). */
export const customerSchema = z.object({
  ...partyShape,
  customerName: z.string().trim().min(1, "validation.nameRequired"),
  fileNumber: z.string().trim().nullish(),
  sphRight: eye, sphLeft: eye, cylRight: eye, cylLeft: eye, axisRight: eye, axisLeft: eye, add: eye, ipd: eye, clRight: eye, clLeft: eye,
  companions: z.array(z.object({
    id: z.number().optional(),
    name: z.string().trim().min(1, "validation.companionNameRequired"),
    phone: z.string().trim().nullish(),
    sphRight: eye, sphLeft: eye, cylRight: eye, cylLeft: eye, axisRight: eye, axisLeft: eye, add: eye, ipd: eye, clRight: eye, clLeft: eye,
  })),
}).superRefine(refineParty)
export type CustomerForm = z.infer<typeof customerSchema>

export { openingBalanceSchema, type OpeningBalanceForm } from "@/modules/partners/schema"

/** The country field is read-only and always the ISO code. */
export const COUNTRY_CODE = "SA"

export const emptyCustomer: CustomerForm = {
  customerName: "", phone: "", address: "", isNational: true, taxNumber: "", commercialRegister: "",
  countryName: COUNTRY_CODE, stateName: "", cityName: "", district: "", street: "", buildingNumber: "", additionalNumber: "", postalCode: "",
  openingBalance: 0, openingBalanceType: "Debit", openingBalanceDate: new Date().toISOString().slice(0, 10),
  fileNumber: "", ...emptyMeasurement, companions: [],
}
