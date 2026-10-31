/** Fields returned by /Treasurys, without response normalization. */
export type Treasury = {
  id: number
  name: string
  openingBalance?: number | null
  openingBalanceDate?: string | null
  currentBalance?: number | null
  showInSalesScreen?: boolean | null
}

/** Values accepted by the treasury form and write endpoints. */
export type TreasuryInput = {
  name: string
  openingBalance: number
  openingBalanceDate: string
  showInSalesScreen: boolean
}

export type Transfer = {
  id: number
  fromTreasuryId: number
  toTreasuryId: number
  amount: number
  date: string
  notes?: string | null
}
export type TransferInput = {
  fromTreasuryId: number
  toTreasuryId: number
  amount: number
  date: string
  notes: string
}

/** One line of a treasury statement. debit brings money in, credit takes it out. */
export type StatementRow = { date: string; type: string; number: string; debit: number; credit: number; balance: number; partyName: string; paymentMethod: string | null }
