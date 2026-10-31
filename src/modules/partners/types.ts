/** Fields customers and suppliers share: identity, the national address ZATCA asks for on B2B invoices, and an opening balance. */
export type Address = {
  country: string
  state: string
  city: string
  district: string
  street: string
  buildingNumber: string
  additionalNumber: string
  postalCode: string
}

export type PartyBase = Address & {
  id: number
  code: number
  name: string
  phone: string
  email: string
  /** Registered in Saudi Arabia; foreign parties don't need a VAT number. */
  isNational: boolean
  taxNumber: string
  commercialRegister: string
  openingBalance: number
  /** debit: they owed us at the start; credit: we owed them. */
  openingBalanceType: "debit" | "credit"
  openingBalanceDate: string
  isActive: boolean
}

export const emptyAddress: Address = { country: "السعودية", state: "", city: "", district: "", street: "", buildingNumber: "", additionalNumber: "", postalCode: "" }

/** Fields customers and suppliers return with the same names, as the server sends them. */
export type PartyDto = {
  phone?: string | null
  mobile?: string | null
  email?: string | null
  address?: string | null
  buildingNumber?: string | null
  additionalNumber?: string | null
  cityName?: string | null
  stateName?: string | null
  countryName?: string | null
  district?: string | null
  street?: string | null
  postalCode?: string | null
  commercialRegister?: string | null
  taxNumber?: string | null
  isNational?: boolean | null
  balance?: number | null
  openingBalance?: number | null
  openingBalanceDate?: string | null
  /** Older rows come back as 1/2, newer ones as the enum name. */
  openingBalanceType?: "Debit" | "Credit" | number | null
  isActive?: boolean | null
  createdAt?: string | null
}
