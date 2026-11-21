import { z } from "zod"

/** Customer / supplier fields with the same names on the server. A Saudi party with a VAT number must have a valid one and a full national address. */
export const partyShape = {
  phone: z.string().trim().regex(/^\d*$/, "validation.digitsOnly").nullish(),
  address: z.string().nullish(),
  isNational: z.boolean(),
  taxNumber: z.string().trim().nullish(),
  commercialRegister: z.string().trim().regex(/^\d*$/, "validation.digitsOnly").nullish(),
  countryName: z.string().trim().nullish(),
  stateName: z.string().trim().nullish(),
  cityName: z.string().trim().nullish(),
  district: z.string().trim().nullish(),
  street: z.string().trim().nullish(),
  buildingNumber: z.string().trim().regex(/^\d{0,4}$/, "validation.buildingNumber").nullish(),
  additionalNumber: z.string().trim().regex(/^\d{0,4}$/, "validation.additionalNumber").nullish(),
  postalCode: z.string().trim().regex(/^\d{0,5}$/, "validation.postalCode").nullish(),
  openingBalance: z.number({ error: "validation.number" }).min(0, "validation.min0").nullish(),
  openingBalanceType: z.enum(["Debit", "Credit"]),
  openingBalanceDate: z.string().nullish(),
}

type PartyLike = { isNational: boolean; taxNumber?: string | null; cityName?: string | null; street?: string | null; buildingNumber?: string | null; postalCode?: string | null; district?: string | null }

export function refineParty(v: PartyLike, ctx: z.RefinementCtx) {
  if (!v.isNational || !v.taxNumber) return
  // Saudi VAT numbers: 15 digits, starting and ending with 3.
  if (!/^3\d{13}3$/.test(v.taxNumber)) ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "validation.vatFormat" })
  for (const key of ["cityName", "district", "street", "buildingNumber", "postalCode"] as const) {
    if (!v[key]) ctx.addIssue({ code: "custom", path: [key], message: "validation.addressForVat" })
  }
}

/** The separate opening-balance pop-up of a customer or supplier: only these three fields of the Update DTO. */
export const openingBalanceSchema = z.object({
  openingBalance: z.number({ error: "validation.number" }).min(0, "validation.min0"),
  openingBalanceType: z.enum(["Debit", "Credit"]),
  openingBalanceDate: z.string().min(1, "validation.number"),
})
export type OpeningBalanceForm = z.infer<typeof openingBalanceSchema>
