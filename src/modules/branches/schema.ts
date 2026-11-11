import { z } from "zod"
import { IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/image"
import type { Branch } from "./types"

const text = z.string().trim()
const english = /^[a-zA-Z0-9\s\-_.,'&()]*$/

export const branchSchema = z.object({
  code: text.min(1, "branchForm.err.code").max(20),
  name: text.min(1, "branchForm.err.name").max(100),
  nameEn: text.regex(english, "branchForm.err.english"),
  shortName: text,
  shortNameEn: text.regex(english, "branchForm.err.english"),
  phone: text.regex(/^(05\d{8}|)$/, "branchForm.err.phone"),
  commercialRegister: text.max(20, "branchForm.err.commercialRegister"),
  taxNumber: text
    .refine((v) => v === "" || v.length === 15, "branchForm.err.tax15")
    .refine((v) => v === "" || /^\d+$/.test(v), "branchForm.err.taxDigits")
    .refine((v) => v === "" || v.startsWith("3"), "branchForm.err.taxStart")
    .refine((v) => v === "" || v.endsWith("3"), "branchForm.err.taxEnd"),
  footerNote: text, iban: text, bankName: text, bankNameEn: text, bankAccountName: text, bankAccountNameEn: text, bankAccountNumber: text,
  street: text, district: text,
  buildingNumber: text.regex(/^\d{0,4}$/, "branchForm.err.building"),
  subNumber: text.regex(/^\d{0,4}$/, "branchForm.err.sub"),
  postalCode: text.regex(/^(\d{5}|)$/, "branchForm.err.postal"),
  cityName: text.min(1, "branchForm.err.city"),
  stateName: text.min(1, "branchForm.err.state"),
  locationAddress: text,
  organizationUnitName: text.min(2, "branchForm.err.unit"),
  industryBusinessCategory: text.min(2, "branchForm.err.category"),
  /** The picture already saved; emptied when the user removes it. */
  imageUrl: z.string(),
  stampImageUrl: z.string(),
  image: z.instanceof(File)
    .refine((f) => f.size <= MAX_IMAGE_SIZE, "products.imageTooBig")
    .refine((f) => IMAGE_TYPES.includes(f.type), "products.imageType")
    .nullable(),
  stampImage: z.instanceof(File)
    .refine((f) => f.size <= MAX_IMAGE_SIZE, "products.imageTooBig")
    .refine((f) => IMAGE_TYPES.includes(f.type), "products.imageType")
    .nullable(),
})
export type BranchForm = z.infer<typeof branchSchema>

export const emptyBranch: BranchForm = {
  code: "", name: "", nameEn: "", shortName: "", shortNameEn: "", phone: "", commercialRegister: "", taxNumber: "", footerNote: "", iban: "",
  bankName: "", bankNameEn: "", bankAccountName: "", bankAccountNameEn: "", bankAccountNumber: "", street: "", district: "", buildingNumber: "", subNumber: "",
  postalCode: "", cityName: "", stateName: "", locationAddress: "", organizationUnitName: "", industryBusinessCategory: "", imageUrl: "", stampImageUrl: "", image: null, stampImage: null,
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
  imageUrl: branch.imageUrl ?? "",
  stampImageUrl: branch.stampImageUrl ?? "",
  image: null,
  stampImage: null,
})
