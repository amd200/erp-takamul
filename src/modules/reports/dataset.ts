import { productsApi } from "@/modules/products/service"
import type { Product } from "@/modules/products/types"
import { categoriesApi } from "@/modules/categories/service"
import type { Category } from "@/modules/categories/types"

/**
 * Example ledger for the reports: 45 days of sales, returns, purchases, expenses, payments and
 * shifts, generated deterministically from the item catalogue so figures are consistent across
 * reports (the same sale shows up in sales, profit, stock movement and the customer statement).
 * The real backend computes every report server-side.
 */
export type SaleLine = {
  date: string; invoice: string; channel: "A4" | "POS"; customerId: number; employeeId: number; shiftId: number
  method: "Cash" | "Card"; productId: number; qty: number; net: number; tax: number; cost: number
}
export type ReturnLine = SaleLine & { returnNo: string }
export type PurchaseLine = { date: string; invoice: string; supplierId: number; productId: number; qty: number; net: number; tax: number }
export type Expense = { date: string; item: string; notes: string; treasuryId: number; amount: number; tax: number }
export type PartyPayment = { date: string; ref: string; partyId: number; amount: number }
export type Shift = {
  id: number; user: string; openedAt: string; closedAt: string; opening: number
  cash: number; card: number; returns: number; expenses: number; counted: number
}

export type Dataset = {
  products: Product[]
  categories: Category[]
  sales: SaleLine[]
  returns: ReturnLine[]
  purchases: PurchaseLine[]
  expenses: Expense[]
  receipts: PartyPayment[]
  supplierPayments: PartyPayment[]
  shifts: Shift[]
  adjustments: { date: string; productId: number; qty: number; ref: string }[]
  /** Raw materials used by prepared items sold. */
  consumption: { date: string; productId: number; qty: number; ref: string }[]
}

const DAYS = 45
const r2 = (n: number) => Math.round(n * 100) / 100

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Cleaning goods come from the cleaning supplier; everything else is split between the two food suppliers. */
function groupBySupplier<T extends { p: Product }>(needs: T[], int: (a: number, b: number) => number) {
  const out = new Map<number, T[]>()
  for (const n of needs) {
    const id = n.p.categoryId === 5 ? 3 : int(1, 2)
    out.set(id, [...(out.get(id) ?? []), n])
  }
  return out
}

export const isoDay = (d: Date) => d.toISOString().slice(0, 10)
export const daysAgo = (n: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoDay(d) }

function build(products: Product[], categories: Category[]): Dataset {
  const rand = rng(20261018)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

  const sellable = products.filter((p) => p.productType !== "RawMatrial" && p.productType !== "Branched" && p.isActive !== false)
  const stocked = products.filter((p) => p.productType === "Direct" || p.productType === "RawMatrial")
  const rateOf = (p: Product) => (p.taxId === 2 ? 0 : 15)
  const ds: Dataset = { products, categories, sales: [], returns: [], purchases: [], expenses: [], receipts: [], supplierPayments: [], shifts: [], adjustments: [], consumption: [] }
  let inv = 7000, pur = 300, ret = 600, shiftId = 1

  for (let back = DAYS - 1; back >= 0; back--) {
    const date = daysAgo(back)
    const weekend = new Date(date).getDay() === 5
    const dayShifts = [0, 1].map((half) => ({ id: shiftId++, user: `#${half + 1}`, half }))
    const invoices = int(weekend ? 12 : 6, weekend ? 18 : 13)
    for (let i = 0; i < invoices; i++) {
      const channel = rand() < 0.72 ? "POS" : "A4"
      const customerId = channel === "POS" || rand() < 0.4 ? 1 : int(2, 5)
      const shift = dayShifts[i < invoices / 2 ? 0 : 1]
      const method = rand() < 0.55 ? "Cash" : "Card"
      const number = `${channel === "POS" ? "POS" : "INV"}-${inv++}`
      for (let l = int(1, 4); l > 0; l--) {
        const p = pick(sellable)
        const qty = int(1, channel === "A4" ? 12 : 4)
        const rate = rateOf(p)
        const net = r2(((p.sellingPrice ?? 0) / (1 + rate / 100)) * qty)
        ds.sales.push({ date, invoice: number, channel, customerId, employeeId: shift.half + 1, shiftId: shift.id, method, productId: p.id, qty, net, tax: r2(net * rate / 100), cost: r2((p.costPrice ?? 0) * qty) })
      }
    }
    // A few returns from recent invoices.
    if (rand() < 0.35 && ds.sales.length > 20) {
      const src = ds.sales[ds.sales.length - int(5, 20)]
      const qty = Math.min(src.qty, int(1, 2))
      ds.returns.push({ ...src, date, shiftId: dayShifts[1].id, returnNo: `RET-${ret++}`, qty, net: r2(src.net / src.qty * qty), tax: r2(src.tax / src.qty * qty), cost: r2(src.cost / src.qty * qty) })
    }
    if (new Date(date).getDate() === 1) {
      ds.expenses.push({ date, item: "إيجار", notes: "إيجار الفرع الشهري", treasuryId: 2, amount: 6000, tax: 0 })
      ds.expenses.push({ date, item: "رواتب", notes: "رواتب الشهر", treasuryId: 2, amount: 14500, tax: 0 })
    }
    if (rand() < 0.5) {
      const item = pick(["كهرباء ومياه", "صيانة", "نقل وتوصيل", "مستلزمات نظافة", "ضيافة"])
      const amount = r2(item === "كهرباء ومياه" ? int(900, 1600) : int(60, 650))
      ds.expenses.push({ date, item, notes: "", treasuryId: 1, amount, tax: r2(amount * 0.15) })
    }
    if (back % 6 === 2) ds.receipts.push({ date, ref: `RCV-${900 + back}`, partyId: int(2, 5), amount: r2(int(5, 40) * 100) })
    if (back % 7 === 4) ds.supplierPayments.push({ date, ref: `PAY-${400 + back}`, partyId: int(1, 3), amount: r2(int(10, 60) * 100) })
    if (back % 9 === 5) {
      const p = pick(stocked)
      ds.adjustments.push({ date, productId: p.id, qty: rand() < 0.5 ? -int(1, 5) : int(1, 10), ref: `ADJ-${100 + back}` })
    }

    for (const s of dayShifts) {
      const lines = ds.sales.filter((x) => x.shiftId === s.id)
      const total = (m: string) => r2(lines.filter((x) => x.method === m).reduce((a, x) => a + x.net + x.tax, 0))
      const returns = r2(ds.returns.filter((x) => x.date === date && x.shiftId === s.id).reduce((a, x) => a + x.net + x.tax, 0))
      const expenses = s.half === 0 ? r2(ds.expenses.filter((e) => e.date === date && e.treasuryId === 1).reduce((a, e) => a + e.amount + e.tax, 0)) : 0
      const expected = 500 + total("Cash") - returns - expenses
      const diff = rand() < 0.75 ? 0 : r2((rand() - 0.6) * 60)
      ds.shifts.push({ id: s.id, user: s.user, openedAt: `${date}T${s.half ? "15" : "07"}:00:00`, closedAt: `${date}T${s.half ? "23" : "15"}:00:00`,
        opening: 500, cash: total("Cash"), card: total("Card"), returns, expenses, counted: r2(expected + diff) })
    }
  }

  // Selling a prepared item uses up its raw materials.
  for (const l of ds.sales) {
    const p = products.find((x) => x.id === l.productId)
    for (const c of p?.components ?? []) ds.consumption.push({ date: l.date, productId: c.componentProductId, qty: r2(c.quantity * l.qty), ref: l.invoice })
  }

  // Every third day, order what the next three days will need, so stock never runs below what's on hand today.
  for (let back = DAYS - 1; back >= 0; back--) {
    if (back % 3 !== 0) continue
    const from = daysAgo(back), to = daysAgo(Math.max(back - 2, 0))
    const window = (d: string) => d >= from && d <= to
    const needs = stocked.map((p) => ({
      p,
      qty: Math.ceil(
        ds.sales.filter((l) => l.productId === p.id && window(l.date)).reduce((a, l) => a + l.qty, 0)
        + ds.consumption.filter((c) => c.productId === p.id && window(c.date)).reduce((a, c) => a + c.qty, 0),
      ),
    })).filter((n) => n.qty > 0)
    for (const [supplierId, group] of groupBySupplier(needs, int)) {
      const number = `PUR-${pur++}`
      for (const { p, qty } of group) {
        const net = r2((p.costPrice ?? 0) * qty)
        ds.purchases.push({ date: from, invoice: number, supplierId, productId: p.id, qty, net, tax: r2(net * 0.15) })
      }
    }
  }
  return ds
}

let cached: Promise<Dataset> | null = null
export const loadDataset = () => (cached ??= Promise.all([productsApi.list(), categoriesApi.list()]).then(([p, c]) => build(p, c)))
