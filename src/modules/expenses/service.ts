import { http } from "@/shared/http/request"
import { fetchAllPages } from "@/shared/http/paged"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import type { Expense, ExpenseInput, ExpenseItem, ExpenseItemInput } from "./types"

const body = (e: ExpenseInput) => ({ name: e.name, amount: e.amount, date: e.date, notes: e.notes, treasuryId: e.treasuryId, itemId: e.itemId })

export const expenseItemsApi = {
  list: () => fetchAllPages<ExpenseItem>("/Items"),
  get: (id: number) => http<ExpenseItem>(`/Items/${id}`),
  // A new item starts active; the server only takes its name.
  create: (data: ExpenseItemInput) => http<unknown>("/Items", { method: "POST", data: { name: data.name } }),
  update: (id: number, data: ExpenseItemInput) => http<unknown>(`/Items/${id}`, { method: "PUT", data: { name: data.name, isActive: data.isActive } }),
  remove: (id: number) => http<unknown>(`/Items/${id}`, { method: "DELETE" }),
}

export const expensesApi = {
  list: () => fetchAllPages<Expense>("/Expenses"),
  // Recorded on the active branch (X-Branch-Id); a retried save resends the same key so the money is not taken twice.
  create: (data: ExpenseInput, key?: string | null) =>
    retryWhileInProgress(() => http<unknown>("/Expenses", { method: "POST", data: body(data), headers: idempotencyHeaders(key) })),
  update: (id: number, data: ExpenseInput) => http<unknown>(`/Expenses/${id}`, { method: "PUT", data: { id, ...body(data) } }),
  remove: (id: number) => http<unknown>(`/Expenses/${id}`, { method: "DELETE" }),
}
