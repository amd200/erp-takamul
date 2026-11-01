import { useCallback, useEffect, useMemo, useState } from "react"
import { pickTreasury } from "@/modules/lookups/service"
import { useAppSettings } from "@/modules/settings"
import { useTreasuryList } from "@/modules/treasuries/queries"
import type { PosPayment } from "../types"

export type PaymentProps = {
  open: boolean
  onOpenChange: (o: boolean) => void
  total: number
  hasCustomer: boolean
  customerName: string
  /** The customer's name under the title; the second sales screen leaves it out. */
  showCustomer?: boolean
  pending: boolean
  /** Paying a purchase: starts on the default purchases treasury instead of the sales one. */
  purchase?: boolean
  /** `print` says whether the receipt is printed after saving ("save and print") or not ("save only"). */
  onConfirm: (payments: PosPayment[], print: boolean) => void
}

export type Split = { id: number; treasuryId: number; raw: string }
export type Mode = "single" | "split" | "credit"

const round = (n: number) => Math.round(n * 100) / 100
export const amountOf = (raw: string) => { const v = parseFloat(raw); return Number.isFinite(v) ? v : 0 }

/** Digits, one decimal point, two decimals at most. `fresh` means the next key replaces what is there. */
export function typeKey(raw: string, key: string, fresh: boolean) {
  if (key === "back") return raw.length > 1 ? raw.slice(0, -1) : "0"
  const base = fresh ? "0" : raw
  if (key === ".") return base.includes(".") ? base : `${base}.`
  const next = key === "00" ? (base === "0" ? "0" : `${base}00`) : base === "0" ? key : base + key
  return /^\d{0,9}(\.\d{0,2})?$/.test(next) ? next : base
}

let seq = 0

/**
 * The state every payment screen shares: which treasury (or treasuries) the money goes to, how much, whether the
 * sale stays on the customer's account, and what to send. Each screen only decides how this looks.
 */
export function usePayment({ open, total, hasCustomer, purchase }: Pick<PaymentProps, "open" | "total" | "hasCustomer" | "purchase">) {
  const treasuriesQ = useTreasuryList()
  const sales = useAppSettings().sales ?? {}
  const defaultVault = purchase ? sales.defaultPurchasesVault : sales.defaultSalesVault
  // Only treasuries marked for the sales screen are offered; with none marked, all of them are.
  const treasuries = useMemo(() => {
    const all = treasuriesQ.data ?? []
    const shown = all.filter((x) => x.showInSalesScreen)
    return shown.length ? shown : all
  }, [treasuriesQ.data])

  const [mode, setMode] = useState<Mode>("single")
  const [singleId, setSingleId] = useState(0)
  const [singleRaw, setSingleRaw] = useState("0")
  const [splits, setSplits] = useState<Split[]>([])
  const [activeId, setActiveId] = useState(0)
  const [fresh, setFresh] = useState(true)

  useEffect(() => {
    if (!open) return
    setMode("single"); setSingleId(pickTreasury(treasuries, defaultVault)?.id ?? 0); setSingleRaw(total.toFixed(2)); setSplits([]); setActiveId(0); setFresh(true)
  }, [open, total, treasuries, defaultVault])

  const paid = mode === "single" ? amountOf(singleRaw) : mode === "split" ? splits.reduce((s, x) => s + amountOf(x.raw), 0) : 0
  const change = round(paid - total)
  const remaining = round(Math.max(0, total - paid))
  const credit = mode === "credit"

  // A sale can be paid in part only when a customer's account takes the rest.
  const fullyPaid = paid + 0.001 >= total
  const canSave = total === 0 || (credit ? hasCustomer : treasuries.length > 0 && paid > 0 && (fullyPaid || hasCustomer) && (mode !== "split" || splits.every((s) => s.treasuryId > 0)))

  const selectSingle = useCallback((id: number) => { setMode("single"); setSingleId(id); setFresh(true) }, [])
  const selectCredit = () => { setMode("credit"); setFresh(true) }

  /** `empty` starts every share at zero (the first design, which offers up to three treasuries). */
  const startSplit = (ids?: number[], empty?: boolean) => {
    const pick = ids ?? treasuries.slice(0, empty ? 3 : 2).map((x) => x.id)
    const first = pick[0] ?? singleId
    setSplits(pick.map((id, i) => ({ id: seq++, treasuryId: id, raw: i === 0 && !empty ? total.toFixed(2) : empty ? "0" : "0.00" })))
    setActiveId(seq - pick.length)
    setSingleId(first); setMode("split"); setFresh(true)
  }
  const stopSplit = () => { setMode("single"); setSingleRaw(total.toFixed(2)); setFresh(true) }
  const toggleSplit = () => (mode === "split" ? stopSplit() : startSplit())

  /** In the two-treasury split, the other side is whatever is left of the total. */
  const setSplitRaw = (id: number, raw: string) => setSplits((all) => all.map((s) => {
    if (s.id === id) return { ...s, raw }
    return all.length === 2 ? { ...s, raw: round(Math.max(0, total - amountOf(raw))).toFixed(2) } : s
  }))
  const toggleSplitTreasury = (treasuryId: number) => setSplits((all) => {
    const has = all.some((s) => s.treasuryId === treasuryId)
    if (has) return all.length > 1 ? all.filter((s) => s.treasuryId !== treasuryId) : all
    if (all.length >= 2) return all
    return [...all, { id: seq++, treasuryId, raw: round(Math.max(0, total - all.reduce((s, x) => s + amountOf(x.raw), 0))).toFixed(2) }]
  })
  const activate = (id: number) => { setActiveId(id); setFresh(true) }

  const pushKey = (key: string) => {
    if (mode === "single") setSingleRaw((raw) => typeKey(raw, key, fresh))
    else if (mode === "split") {
      const target = splits.find((s) => s.id === activeId) ?? splits[0]
      if (target) setSplitRaw(target.id, typeKey(target.raw, key, fresh))
    }
    setFresh(false)
  }

  /** Cash handed over beyond the total comes back as change, so what is sent never exceeds the total. */
  const payments = useCallback((): PosPayment[] => {
    if (credit) return []
    let room = round(total)
    const rows = mode === "single" ? [{ treasuryId: singleId, raw: singleRaw }] : splits
    return rows.map((r) => {
      const amount = round(Math.min(amountOf(r.raw), room))
      room = round(room - amount)
      return { treasuryId: r.treasuryId, method: "Cash" as const, amount }
    }).filter((p) => p.amount > 0)
  }, [credit, mode, singleId, singleRaw, splits, total])

  return {
    treasuries, loading: treasuriesQ.isLoading, error: treasuriesQ.isError,
    mode, singleId, singleRaw, setSingleRaw, splits, activeId, activate,
    paid: round(paid), change, remaining, credit, canSave, hasCustomer,
    selectSingle, selectCredit, toggleSplit, startSplit, stopSplit, setSplitRaw, toggleSplitTreasury, pushKey, payments,
  }
}

export type Payment = ReturnType<typeof usePayment>
