import { http } from "@/shared/http/request"
import { currentBranchId } from "@/modules/partners/mappers"
import type { Treasury, TreasuryInput, Transfer, TransferInput, StatementRow } from "./types"

const body = (t: TreasuryInput) => ({ name: t.name, openingBalance: t.openingBalance, openingBalanceDate: t.openingBalanceDate || null, showInSalesScreen: t.showInSalesScreen })

export const treasuriesApi = {
  list: () => http<Treasury[]>("/Treasurys"),
  get: (id: number) => http<Treasury>(`/Treasurys/${id}`),
  create: (data: TreasuryInput) => http<unknown>("/Treasurys", { method: "POST", data: { ...body(data), branchId: currentBranchId() } }),
  update: (id: number, data: TreasuryInput) => http<unknown>(`/Treasurys/${id}`, { method: "PUT", data: body(data) }),
  remove: (id: number) => http<unknown>(`/Treasurys/${id}`, { method: "DELETE" }),
  statement: (treasuryId: number, from: string, to: string) => http<StatementRow[]>("/Treasurys/statement", { params: { treasuryId, from, to } }),
  transfers: () => http<Transfer[]>("/Treasurys/transfers"),
  transfer: (t: TransferInput) => http<unknown>("/Treasurys/transfer", { method: "POST", data: { fromTreasuryId: t.fromTreasuryId, toTreasuryId: t.toTreasuryId, amount: t.amount, date: t.date, notes: t.notes || null } }),
  deleteTransfer: (id: number) => http<unknown>(`/Treasurys/deleteTransfer/${id}`, { method: "DELETE" }),
  /** The server only takes the treasury and the amount for these two. */
  cashMove: ({ treasuryId, amount, kind }: { treasuryId: number; amount: number; kind: "deposit" | "withdraw" }) =>
    http<unknown>(`/Treasurys/${kind}`, { method: "POST", data: { treasuryId, amount } }),
}
