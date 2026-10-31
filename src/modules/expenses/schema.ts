import { z } from "zod"

export const expenseItemSchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  isActive: z.boolean(),
})
export type ExpenseItemForm = z.infer<typeof expenseItemSchema>
export const emptyExpenseItem: ExpenseItemForm = { name: "", isActive: true }

export const expenseSchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
  date: z.string().min(1, "validation.dateRequired"),
  treasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  itemId: z.number().nullable(),
  notes: z.string(),
})
export type ExpenseForm = z.infer<typeof expenseSchema>

const today = () => new Date().toLocaleDateString("sv")
export const emptyExpense = (): ExpenseForm => ({ name: "", amount: 0, date: today(), treasuryId: 0, itemId: null, notes: "" })
