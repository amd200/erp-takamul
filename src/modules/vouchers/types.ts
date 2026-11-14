/**
 * Receipt (قبض) and payment (صرف) vouchers. Receipts live in /CustomerTransaction and payments in
 * /SupplierTransaction; each can name a customer or a supplier as the other side (a refund).
 * The server moves the party's balance and the treasury's together.
 */
export type VoucherKind = "receipt" | "payment"

export type PartyType = "customer" | "supplier"

/** A transaction, as the server sends it. */
export type TransactionDto = {
  id: number
  paymentNumber?: string | null
  customerId?: number | null
  customerName?: string | null
  supplierId?: number | null
  supplierName?: string | null
  partyName?: string | null
  treasuryId?: number | null
  treasuryName?: string | null
  transactionDate: string
  amount: number
  description?: string | null
}

/** A transaction with the list it came from, since receipts and payments live in different tables. */
export type Voucher = TransactionDto & { kind: VoucherKind }

export type VoucherInput = { kind: VoucherKind; partyType: PartyType; partyId: number; treasuryId: number; date: string; amount: number; description: string; key?: string }

/** The server sends no voucher number, so it is the kind and the id. */
export const voucherNumber = (v: Pick<Voucher, "kind" | "id">) => `${v.kind === "receipt" ? "RCV" : "PAY"}-${v.id}`
export const partyTypeOf = (v: Pick<TransactionDto, "supplierId">): PartyType => (v.supplierId ? "supplier" : "customer")
