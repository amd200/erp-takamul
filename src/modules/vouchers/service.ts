import type { ListSort } from "@/shared/api/crudQueries"
import { http } from "@/shared/http/request"
import type { VoucherKind, Voucher, VoucherInput, TransactionDto } from "./types"

const PATH: Record<VoucherKind, string> = { receipt: "/CustomerTransaction", payment: "/SupplierTransaction" }
/** The form gives a day; the server wants a moment, so stamp it with the current time. */
const stamp = (day: string) => `${day}T${new Date().toTimeString().slice(0, 8)}`

export const vouchersApi = {
  list: async (sort?: ListSort) => {
    const [receipts, payments] = await Promise.all([
      http<TransactionDto[]>(PATH.receipt, { params: { ...sort } }),
      http<TransactionDto[]>(PATH.payment, { params: { ...sort } }),
    ])
    return [...receipts.map((d): Voucher => ({ ...d, kind: "receipt" })), ...payments.map((d): Voucher => ({ ...d, kind: "payment" }))]
  },
  create: (v: VoucherInput) => http<unknown>(PATH[v.kind], {
    method: "POST",
    data: {
      customerId: v.partyType === "customer" ? v.partyId : null,
      supplierId: v.partyType === "supplier" ? v.partyId : null,
      treasuryId: v.treasuryId,
      transactionDate: stamp(v.date),
      amount: v.amount,
      description: v.description || null,
    },
  }),
  // Receipt and payment ids come from different tables, so deleting needs the kind too.
  remove: (v: Pick<Voucher, "id" | "kind">) => http<unknown>(`${PATH[v.kind]}/${v.id}`, { method: "DELETE" }),
}
