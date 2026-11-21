/** Fields customers and suppliers return with the same names, as the server sends them. */
export type PartyDto = {
  phone?: string | null
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
  isNational?: boolean
  balance?: number | null
  openingBalance?: number | null
  openingBalanceDate?: string | null
  openingBalanceType?: "Debit" | "Credit"
  isActive?: boolean
  createdAt?: string | null
}
