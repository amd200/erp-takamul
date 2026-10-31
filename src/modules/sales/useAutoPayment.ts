import { useEffect, useRef } from "react"
import type { FieldValues, UseFieldArrayReturn, UseFormReturn } from "react-hook-form"
import type { PaymentMethod } from "./types"

type Row = { amount: number; method: PaymentMethod; treasuryId: number; notes: string }

/**
 * A new invoice starts with one payment for the whole total, so the cashier does not have to add it: it appears as
 * soon as there are items and follows the total while they add or change them. The moment the user edits that
 * payment (a smaller amount, another treasury) or removes it, it is theirs and is never touched again.
 */
export function useAutoPayment<T extends FieldValues & { payments: Row[] }>({ form, payments, pays, total, treasuryId, enabled }: {
  form: UseFormReturn<T>
  payments: UseFieldArrayReturn<T>
  pays: Row[]
  total: number
  /** The default treasury; the payment waits until the treasuries have loaded. */
  treasuryId: number
  enabled: boolean
}) {
  const manual = useRef(false)
  const last = useRef<number | null>(null)
  const own = useRef(false)

  // Anything other than our own single row at the amount we put there means the user took over.
  useEffect(() => {
    if (!enabled || manual.current) return
    if (own.current) { own.current = false; return }
    if (last.current === null) return
    const untouched = pays.length === 1 && Math.abs((pays[0].amount || 0) - last.current) < 0.005
    if (!untouched) manual.current = true
  }, [pays, enabled])

  useEffect(() => {
    if (!enabled || manual.current || !treasuryId) return
    const amount = Math.round(total * 100) / 100
    if (amount <= 0) {
      if (payments.fields.length === 1 && last.current !== null) { own.current = true; last.current = null; payments.remove(0) }
      return
    }
    if (payments.fields.length === 0) {
      own.current = true; last.current = amount
      payments.append({ amount, method: "Cash", treasuryId, notes: "" } as never, { shouldFocus: false })
    } else if (payments.fields.length === 1 && last.current !== null && Math.abs(last.current - amount) > 0.004) {
      own.current = true; last.current = amount
      form.setValue("payments.0.amount" as never, amount as never, { shouldValidate: true })
    }
  }, [total, treasuryId, enabled, payments, form])
}
