import { z } from "zod"
import { COUNTRY_CODE, partyShape, refineParty } from "@/modules/partners/schema"

/** The add / edit form holds the server's own field names (CreateSupplierDto / UpdateSupplierDto). */
export const supplierSchema = z
  .object({
    ...partyShape,
    supplierName: z.string().trim().min(1, "validation.nameRequired"),
    email: z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "validation.emailInvalid").nullish(),
    paymentTerms: z.number({ error: "validation.number" }).int("validation.wholeNumber").min(0, "validation.min0"),
  })
  .superRefine(refineParty)
export type SupplierForm = z.infer<typeof supplierSchema>

export const emptySupplier: SupplierForm = {
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  isNational: true,
  taxNumber: "",
  commercialRegister: "",
  countryName: COUNTRY_CODE,
  stateName: "",
  cityName: "",
  district: "",
  street: "",
  buildingNumber: "",
  additionalNumber: "",
  postalCode: "",
  paymentTerms: 30,
  openingBalance: 0,
  openingBalanceType: "Credit",
  openingBalanceDate: new Date().toISOString().slice(0, 10),
};
