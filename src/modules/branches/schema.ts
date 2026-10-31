import { z } from "zod"
import type { Branch } from "./types"

const text = z.string().trim()

export const branchSchema = z.object({
  code: text.min(1, "validation.codeRequired"),
  name: text.min(1, "validation.nameRequired"),
  nameEn: text, shortName: text, shortNameEn: text,
  phone: text.regex(/^\d*$/, "validation.digitsOnly"),
  commercialRegister: text.regex(/^\d*$/, "validation.digitsOnly"),
  taxNumber: text.refine((v) => v === "" || /^3\d{13}3$/.test(v), "validation.vatFormat"),
  footerNote: text, iban: text, bankName: text, bankNameEn: text, bankAccountName: text, bankAccountNameEn: text, bankAccountNumber: text,
  street: text, district: text,
  buildingNumber: text.regex(/^\d{0,4}$/, "validation.buildingNumber"),
  subNumber: text.regex(/^\d{0,4}$/, "validation.additionalNumber"),
  postalCode: text.regex(/^\d{0,5}$/, "validation.postalCode"),
  cityName: text, stateName: text, locationAddress: text, organizationUnitName: text, industryBusinessCategory: text,
  image: z.instanceof(File).nullable(),
  stampImage: z.instanceof(File).nullable(),
})
export type BranchForm = z.infer<typeof branchSchema>

export const emptyBranch: BranchForm = {
  code: "", name: "", nameEn: "", shortName: "", shortNameEn: "", phone: "", commercialRegister: "", taxNumber: "", footerNote: "", iban: "",
  bankName: "", bankNameEn: "", bankAccountName: "", bankAccountNameEn: "", bankAccountNumber: "", street: "", district: "", buildingNumber: "", subNumber: "",
  postalCode: "", cityName: "", stateName: "", locationAddress: "", organizationUnitName: "", industryBusinessCategory: "", image: null, stampImage: null,
}

/** Normalize only form values; the original API record stays untouched. */
export const branchFormValues = (branch: Branch): BranchForm => ({
  code: branch.code ?? "",
  name: branch.name ?? "",
  nameEn: branch.nameEn ?? "",
  shortName: branch.shortName ?? "",
  shortNameEn: branch.shortNameEn ?? "",
  phone: branch.phone ?? "",
  commercialRegister: branch.commercialRegister ?? "",
  taxNumber: branch.taxNumber ?? "",
  footerNote: branch.footerNote ?? "",
  iban: branch.iban ?? "",
  bankName: branch.bankName ?? "",
  bankNameEn: branch.bankNameEn ?? "",
  bankAccountName: branch.bankAccountName ?? "",
  bankAccountNameEn: branch.bankAccountNameEn ?? "",
  bankAccountNumber: branch.bankAccountNumber ?? "",
  street: branch.street ?? "",
  district: branch.district ?? "",
  buildingNumber: branch.buildingNumber ?? "",
  subNumber: branch.subNumber ?? "",
  postalCode: branch.postalCode ?? "",
  cityName: branch.cityName ?? "",
  stateName: branch.stateName ?? "",
  locationAddress: branch.locationAddress ?? "",
  organizationUnitName: branch.organizationUnitName ?? "",
  industryBusinessCategory: branch.industryBusinessCategory ?? "",
  image: null,
  stampImage: null,
})
