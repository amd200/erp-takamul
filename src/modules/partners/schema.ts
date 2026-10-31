import { z } from "zod"

/** Shared customer/supplier fields. A Saudi party with a VAT number must have a valid one and a full national address. */
export const partyShape = {
  name: z.string().trim().min(1, "validation.nameRequired"),
  phone: z.string().trim().regex(/^\d*$/, "validation.digitsOnly"),
  email: z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "validation.emailInvalid"),
  isNational: z.boolean(),
  taxNumber: z.string().trim(),
  commercialRegister: z.string().trim().regex(/^\d*$/, "validation.digitsOnly"),
  country: z.string().trim(),
  state: z.string().trim(),
  city: z.string().trim(),
  district: z.string().trim(),
  street: z.string().trim(),
  buildingNumber: z.string().trim().regex(/^\d{0,4}$/, "validation.buildingNumber"),
  additionalNumber: z.string().trim().regex(/^\d{0,4}$/, "validation.additionalNumber"),
  postalCode: z.string().trim().regex(/^\d{0,5}$/, "validation.postalCode"),
  openingBalance: z.number({ error: "validation.number" }).min(0, "validation.min0"),
  openingBalanceType: z.enum(["debit", "credit"]),
  openingBalanceDate: z.string(),
  isActive: z.boolean(),
}

type PartyLike = { isNational: boolean; taxNumber: string; city: string; street: string; buildingNumber: string; postalCode: string; district: string }

export function refineParty(v: PartyLike, ctx: z.RefinementCtx) {
  if (!v.isNational || !v.taxNumber) return
  // Saudi VAT numbers: 15 digits, starting and ending with 3.
  if (!/^3\d{13}3$/.test(v.taxNumber)) ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "validation.vatFormat" })
  for (const key of ["city", "district", "street", "buildingNumber", "postalCode"] as const) {
    if (!v[key]) ctx.addIssue({ code: "custom", path: [key], message: "validation.addressForVat" })
  }
}
