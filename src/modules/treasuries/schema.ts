import { z } from "zod"
import type { Treasury } from "./types"

export const treasurySchema = z.object({
  name: z.string().trim().min(1, "validation.nameRequired"),
  openingBalance: z.number({ error: "validation.number" }).min(0, "validation.min0"),
  openingBalanceDate: z.string().min(1, "validation.dateRequired"),
  showInSalesScreen: z.boolean({ error: "validation.required" }),
})
export type TreasuryForm = z.infer<typeof treasurySchema>

const today = () => new Date().toISOString().slice(0, 10)
export const emptyTreasury = (): TreasuryForm => ({ name: "", openingBalance: 0, openingBalanceDate: today(), showInSalesScreen: true })

export const transferSchema = z.object({
  fromTreasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  toTreasuryId: z.number({ error: "validation.treasuryRequired" }).min(1, "validation.treasuryRequired"),
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
  date: z.string().min(1, "validation.dateRequired"),
  notes: z.string(),
}).refine((v) => v.fromTreasuryId !== v.toTreasuryId, { path: ["toTreasuryId"], message: "validation.sameTreasury" })
export type TransferForm = z.infer<typeof transferSchema>
export const emptyTransfer = (): TransferForm => ({ fromTreasuryId: 0, toTreasuryId: 0, amount: 0, date: today(), notes: "" })

export const cashMoveSchema = z.object({
  amount: z.number({ error: "validation.number" }).positive("validation.amountPositive"),
})
export type CashMoveForm = z.infer<typeof cashMoveSchema>

/** Date-only and empty controls belong to the form, not the cached API record.
 * Missing required numbers/booleans stay unset so validation asks for a value.
 */
export const treasuryFormValues = (treasury: Treasury): Partial<TreasuryForm> => ({
  name: treasury.name ?? "",
  openingBalance: treasury.openingBalance ?? undefined,
  openingBalanceDate: treasury.openingBalanceDate?.slice(0, 10) ?? "",
  showInSalesScreen: treasury.showInSalesScreen ?? undefined,
})
