/** Mirrors /Items, as the server sends it: the headings an expense is filed under (rent, salaries, maintenance...). */
export type ExpenseItem = { id: number; name?: string | null; isActive?: boolean | null }
export type ExpenseItemInput = { name: string; isActive: boolean }

/** Mirrors /Expenses, as the server sends it. Recording an expense takes its amount out of the chosen treasury. */
export type Expense = {
  id: number
  name?: string | null
  amount?: number | null
  date?: string | null
  notes?: string | null
  createdBy?: string | null
  treasuryId?: number | null
  treasuryName?: string | null
  itemId?: number | null
  itemName?: string | null
}

export type ExpenseInput = { name: string; amount: number; date: string; notes: string; treasuryId: number; itemId: number | null }
