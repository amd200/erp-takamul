/** Mirrors /Branch/{id}: the branch's identity as it prints on invoices, its bank details and national address. */
export type Branch = {
  id: number
  code?: string | null
  name?: string | null
  nameEn?: string | null
  shortName?: string | null
  shortNameEn?: string | null
  phone?: string | null
  commercialRegister?: string | null
  taxNumber?: string | null
  footerNote?: string | null
  iban?: string | null
  bankName?: string | null
  bankNameEn?: string | null
  bankAccountName?: string | null
  bankAccountNameEn?: string | null
  bankAccountNumber?: string | null
  street?: string | null
  district?: string | null
  buildingNumber?: string | null
  subNumber?: string | null
  postalCode?: string | null
  cityName?: string | null
  stateName?: string | null
  locationAddress?: string | null
  organizationUnitName?: string | null
  industryBusinessCategory?: string | null
  imageUrl?: string | null
  stampImageUrl?: string | null
  isActive?: boolean | null
}

/** What the form edits; a new image is a file, otherwise the current one stays. */
export type BranchInput = {
  [K in Exclude<keyof Branch, "id" | "imageUrl" | "stampImageUrl" | "isActive">]-?: string
} & { image: File | null; stampImage: File | null }

/** Fields used by the branch list, without replacing missing API values. */
export type BranchRow = Pick<Branch, "id" | "code" | "name" | "shortName" | "shortNameEn" | "phone" | "isActive">

export type BranchPage = { items: BranchRow[]; totalCount: number; pageNumber: number; pageSize: number }
export type BranchQuery = { page: number; pageSize: number; searchTerm?: string }
