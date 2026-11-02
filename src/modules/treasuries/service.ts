import type { ListSort } from "@/shared/api/errors"
import { http } from "@/shared/http/request"
import { idempotencyHeaders, retryWhileInProgress } from "@/shared/http/idempotency"
import { currentBranchId } from "@/modules/partners/mappers"
import type { Treasury, TreasuryInput, Transfer, TransferInput, StatementRow } from "./types"

const body = (t: TreasuryInput) => ({ name: t.name, openingBalance: t.openingBalance, openingBalanceDate: t.openingBalanceDate || null, showInSalesScreen: t.showInSalesScreen })

export const treasuriesApi = {
  list: (sort?: ListSort) => http<Treasury[]>("/Treasurys", { params: { ...sort } }),
  get: (id: number) => http<Treasury>(`/Treasurys/${id}`),
  create: (data: TreasuryInput) => http<unknown>("/Treasurys", { method: "POST", data: { ...body(data), branchId: currentBranchId() } }),
  update: (id: number, data: TreasuryInput) => http<unknown>(`/Treasurys/${id}`, { method: "PUT", data: body(data) }),
  remove: (id: number) => http<unknown>(`/Treasurys/${id}`, { method: "DELETE" }),
  statement: (treasuryId: number, from: string, to: string, sort?: ListSort) => http<StatementRow[]>("/Treasurys/statement", { params: { treasuryId, from, to, ...sort } }),
  transfers: (sort?: ListSort) => http<Transfer[]>("/Treasurys/transfers", { params: { ...sort } }),
  transfer: (t: TransferInput) => retryWhileInProgress(() => http<unknown>("/Treasurys/transfer", { method: "POST", headers: idempotencyHeaders(t.key), data: { fromTreasuryId: t.fromTreasuryId, toTreasuryId: t.toTreasuryId, amount: t.amount, date: t.date, notes: t.notes || null } })),
  deleteTransfer: (id: number) => http<unknown>(`/Treasurys/deleteTransfer/${id}`, { method: "DELETE" }),
  /** The server only takes the treasury and the amount for these two. */
  cashMove: ({ treasuryId, amount, kind, key }: { treasuryId: number; amount: number; kind: "deposit" | "withdraw"; key?: string }) =>
    retryWhileInProgress(() => http<unknown>(`/Treasurys/${kind}`, { method: "POST", headers: idempotencyHeaders(key), data: { treasuryId, amount } })),
}
