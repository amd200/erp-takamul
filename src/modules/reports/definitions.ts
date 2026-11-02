import {
  ArrowLeftRight, BarChart3, Boxes, CalendarDays, ClipboardList, Clock, FileText, PackageSearch, Receipt, RotateCcw,
  ScanBarcode, ShoppingBag, TrendingUp, TriangleAlert, Truck, UserRound, Users, Wallet,
} from "lucide-react"
import { P } from "@/shared/permissions/permissions"
import type { Dataset, PurchaseLine, SaleLine } from "./dataset"
import type { Cell, Filters, ReportDef, Row, Tone } from "./types"

/**
 * Every report as data: which filters it takes and how it is computed. The report page renders
 * filters, tiles, table, totals and export from this, so a new report is one entry here
 * plus its title in i18n ("reports.r.<id>") and any new column labels ("reports.c.<id>").
 * Text cells starting with "t:" are i18n keys, translated when shown.
 */
const r2 = (n: number) => Math.round(n * 100) / 100
const sum = <T,>(xs: T[], f: (x: T) => number) => r2(xs.reduce((a, x) => a + f(x), 0))
const inPeriod = (date: string, f: Filters) => date >= f.from && date <= f.to
const badge = (text: string, tone: Tone): Cell => ({ text, tone })
function groupBy<T>(xs: T[], key: (x: T) => string | number) {
  const m = new Map<string | number, T[]>()
  for (const x of xs) { const k = key(x); m.set(k, [...(m.get(k) ?? []), x]) }
  return m
}
const productName = (d: Dataset, id: number) => d.products.find((p) => p.id === id)?.productNameAr ?? `#${id}`
const categoryName = (d: Dataset, id: number | null) => d.categories.find((c) => c.id === id)?.categoryNameAr ?? "—"
const customerName = (id: number) => `#${id}`
const supplierName = (id: number) => `#${id}`
const employeeName = (id: number) => `#${id}`
const days = (f: Filters) => {
  const out: string[] = []
  for (let d = new Date(f.from + "T12:00:00"); d.toISOString().slice(0, 10) <= f.to; d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10))
  return out
}
const total = (l: { net: number; tax: number }) => l.net + l.tax

/** Per-invoice rows for sales or purchases. */
function invoicesOf<T extends SaleLine | PurchaseLine>(lines: T[]) {
  return [...groupBy(lines, (l) => l.invoice).entries()].map(([invoice, ls]) => ({ invoice: String(invoice), first: ls[0], ls,
    qty: sum(ls, (l) => l.qty), net: sum(ls, (l) => l.net), tax: sum(ls, (l) => l.tax) }))
}

/** Running statement for a customer or supplier: opening balance, then movements in order. */
function statement(entries: { date: string; doc: string; desc: string; debit: number; credit: number }[], f: Filters) {
  const sorted = entries.sort((a, b) => a.date.localeCompare(b.date))
  const opening = sum(sorted.filter((e) => e.date < f.from), (e) => e.debit - e.credit)
  let balance = opening
  const rows: Row[] = sorted.filter((e) => inPeriod(e.date, f)).map((e) => {
    balance = r2(balance + e.debit - e.credit)
    return { date: e.date, doc: e.doc, desc: e.desc, debit: e.debit || null, credit: e.credit || null, balance }
  })
  return { opening, rows, closing: balance, debit: sum(rows, (r) => Number(r.debit ?? 0)), credit: sum(rows, (r) => Number(r.credit ?? 0)) }
}

export const REPORTS: ReportDef[] = [
  // ───────────── Sales ─────────────
  {
    id: "net-sales", category: "sales", icon: TrendingUp, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const s = d.sales.filter((l) => inPeriod(l.date, f)), r = d.returns.filter((l) => inPeriod(l.date, f))
      const rows = (["POS", "A4"] as const).map((ch) => {
        const sl = s.filter((l) => l.channel === ch), rl = r.filter((l) => l.channel === ch)
        return { channel: ch === "POS" ? "t:reports.v.pos" : "t:reports.v.a4", sales: sum(sl, total), returns: sum(rl, total), tax: r2(sum(sl, (l) => l.tax) - sum(rl, (l) => l.tax)), net: r2(sum(sl, total) - sum(rl, total)) }
      })
      const gross = sum(s, total), ret = sum(r, total)
      return {
        stats: [{ id: "grossSales", value: gross, kind: "money" }, { id: "returns", value: ret, kind: "money", tone: "bad" }, { id: "netSales", value: r2(gross - ret), kind: "money", tone: "good" }, { id: "vat", value: r2(sum(s, (l) => l.tax) - sum(r, (l) => l.tax)), kind: "money" }],
        columns: [{ id: "channel", kind: "text", strong: true }, { id: "sales", kind: "money" }, { id: "returns", kind: "money" }, { id: "tax", kind: "money" }, { id: "net", kind: "money", strong: true }],
        rows, totals: { channel: "", sales: gross, returns: ret, tax: sum(rows, (x) => x.tax), net: r2(gross - ret) },
      }
    },
  },
  {
    id: "sales-by-invoice", category: "sales", icon: FileText, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const inv = invoicesOf(d.sales.filter((l) => inPeriod(l.date, f) && (!f.customerId || l.customerId === f.customerId)))
      const rows = inv.map((i) => ({ invoice: i.invoice, date: i.first.date, customer: customerName(i.first.customerId), method: `t:sales.methods.${i.first.method}`, net: i.net, tax: i.tax, total: r2(i.net + i.tax) }))
        .sort((a, b) => b.date.localeCompare(a.date))
      return {
        stats: [{ id: "invoices", value: rows.length, kind: "number" }, { id: "totalSales", value: sum(rows, (x) => x.total), kind: "money" }, { id: "avgInvoice", value: rows.length ? r2(sum(rows, (x) => x.total) / rows.length) : 0, kind: "money" }],
        columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "customer", kind: "text" }, { id: "method", kind: "text" }, { id: "net", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { invoice: "", net: sum(rows, (x) => x.net), tax: sum(rows, (x) => x.tax), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "sales-by-day", category: "sales", icon: CalendarDays, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const rows = days(f).map((day) => {
        const ls = d.sales.filter((l) => l.date === day)
        const n = new Set(ls.map((l) => l.invoice)).size
        return { date: day, invoices: n, net: sum(ls, (l) => l.net), tax: sum(ls, (l) => l.tax), total: sum(ls, total), avg: n ? r2(sum(ls, total) / n) : 0 }
      }).reverse()
      const best = [...rows].sort((a, b) => b.total - a.total)[0]
      return {
        stats: [{ id: "totalSales", value: sum(rows, (x) => x.total), kind: "money" }, { id: "dailyAvg", value: rows.length ? r2(sum(rows, (x) => x.total) / rows.length) : 0, kind: "money" }, { id: "bestDay", value: best?.total ?? 0, kind: "money", tone: "good" }],
        columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "net", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "avg", kind: "money" }],
        rows, totals: { date: "", invoices: sum(rows, (x) => x.invoices), net: sum(rows, (x) => x.net), tax: sum(rows, (x) => x.tax), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "item-sales", category: "sales", icon: ScanBarcode, perm: P.reports.sales, filters: ["period", "product"], requires: ["product"],
    run: (d, f) => {
      const ls = d.sales.filter((l) => inPeriod(l.date, f) && l.productId === f.productId)
      const rows = ls.map((l) => ({ date: l.date, invoice: l.invoice, customer: customerName(l.customerId), qty: l.qty, price: r2(total(l) / l.qty), total: r2(total(l)) })).sort((a, b) => b.date.localeCompare(a.date))
      const qty = sum(ls, (l) => l.qty)
      return {
        stats: [{ id: "qtySold", value: qty, kind: "number" }, { id: "totalSales", value: sum(ls, total), kind: "money" }, { id: "avgPrice", value: qty ? r2(sum(ls, total) / qty) : 0, kind: "money" }],
        columns: [{ id: "date", kind: "date" }, { id: "invoice", kind: "text", strong: true }, { id: "customer", kind: "text" }, { id: "qty", kind: "number" }, { id: "price", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { date: "", qty, total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "products-sales", category: "sales", icon: Boxes, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const ls = d.sales.filter((l) => inPeriod(l.date, f) && (!f.categoryId || d.products.find((p) => p.id === l.productId)?.categoryId === f.categoryId))
      const all = sum(ls, total)
      const rows = [...groupBy(ls, (l) => l.productId).entries()].map(([id, g]) => ({
        item: productName(d, Number(id)), category: categoryName(d, d.products.find((p) => p.id === id)?.categoryId ?? null),
        qty: sum(g, (l) => l.qty), net: sum(g, (l) => l.net), tax: sum(g, (l) => l.tax), total: sum(g, total), share: all ? r2((sum(g, total) / all) * 100) : 0,
      })).sort((a, b) => b.total - a.total)
      return {
        stats: [{ id: "itemsSold", value: rows.length, kind: "number" }, { id: "qtySold", value: sum(rows, (x) => x.qty), kind: "number" }, { id: "totalSales", value: all, kind: "money" }],
        columns: [{ id: "item", kind: "text", strong: true }, { id: "category", kind: "text" }, { id: "qty", kind: "number" }, { id: "net", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "share", kind: "percent" }],
        rows, totals: { item: "", qty: sum(rows, (x) => x.qty), net: sum(rows, (x) => x.net), tax: sum(rows, (x) => x.tax), total: all },
      }
    },
  },
  {
    id: "employee-sales", category: "sales", icon: Users, perm: P.reports.sales, filters: ["period", "employee"],
    run: (d, f) => {
      const ls = d.sales.filter((l) => inPeriod(l.date, f) && (!f.employeeId || l.employeeId === f.employeeId))
      const rows = [...groupBy(ls, (l) => l.employeeId).entries()].map(([id, g]) => {
        const n = new Set(g.map((l) => l.invoice)).size
        return { employee: employeeName(Number(id)), invoices: n, qty: sum(g, (l) => l.qty), total: sum(g, total), avg: n ? r2(sum(g, total) / n) : 0 }
      }).sort((a, b) => b.total - a.total)
      return {
        stats: [{ id: "employees", value: rows.length, kind: "number" }, { id: "totalSales", value: sum(rows, (x) => x.total), kind: "money" }],
        columns: [{ id: "employee", kind: "text", strong: true }, { id: "invoices", kind: "number" }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }, { id: "avg", kind: "money" }],
        rows, totals: { employee: "", invoices: sum(rows, (x) => x.invoices), qty: sum(rows, (x) => x.qty), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "sales-returns", category: "sales", icon: RotateCcw, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const ls = d.returns.filter((l) => inPeriod(l.date, f) && (!f.customerId || l.customerId === f.customerId))
      const rows = ls.map((l) => ({ return: l.returnNo, date: l.date, invoice: l.invoice, customer: customerName(l.customerId), item: productName(d, l.productId), qty: l.qty, total: r2(total(l)) })).sort((a, b) => b.date.localeCompare(a.date))
      const salesTotal = sum(d.sales.filter((l) => inPeriod(l.date, f)), total)
      return {
        stats: [{ id: "returnsCount", value: rows.length, kind: "number" }, { id: "returns", value: sum(rows, (x) => x.total), kind: "money", tone: "bad" }, { id: "returnRate", value: salesTotal ? r2((sum(rows, (x) => x.total) / salesTotal) * 100) : 0, kind: "percent" }],
        columns: [{ id: "return", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "invoice", kind: "text" }, { id: "customer", kind: "text" }, { id: "item", kind: "text" }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { return: "", qty: sum(rows, (x) => x.qty), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "shifts", category: "sales", icon: Clock, perm: P.reports.sales, filters: ["period"],
    run: (d, f) => {
      const rows = d.shifts.filter((s) => inPeriod(s.openedAt.slice(0, 10), f)).map((s) => {
        const expected = r2(s.opening + s.cash - s.returns - s.expenses)
        const diff = r2(s.counted - expected)
        return { shift: `#${s.id}`, user: s.user, opened: s.openedAt.slice(0, 10), cash: s.cash, card: s.card, returns: s.returns, expenses: s.expenses, expected, counted: s.counted,
          difference: badge(diff === 0 ? "t:reports.v.matched" : diff > 0 ? `+${diff}` : String(diff), diff === 0 ? "good" : diff > 0 ? "warn" : "bad") }
      }).reverse()
      const short = d.shifts.filter((s) => inPeriod(s.openedAt.slice(0, 10), f) && s.counted < s.opening + s.cash - s.returns - s.expenses - 0.01).length
      return {
        stats: [{ id: "shiftsCount", value: rows.length, kind: "number" }, { id: "cashSales", value: sum(rows, (x) => x.cash), kind: "money" }, { id: "cardSales", value: sum(rows, (x) => x.card), kind: "money" }, { id: "shortShifts", value: short, kind: "number", tone: short ? "bad" : "good" }],
        columns: [{ id: "shift", kind: "text", strong: true }, { id: "user", kind: "text" }, { id: "opened", kind: "date" }, { id: "cash", kind: "money" }, { id: "card", kind: "money" }, { id: "returns", kind: "money" }, { id: "expenses", kind: "money" }, { id: "expected", kind: "money" }, { id: "counted", kind: "money", strong: true }, { id: "difference", kind: "badge" }],
        rows, totals: { shift: "", cash: sum(rows, (x) => x.cash), card: sum(rows, (x) => x.card), returns: sum(rows, (x) => x.returns), expenses: sum(rows, (x) => x.expenses) },
      }
    },
  },

  // ───────────── Items ─────────────
  {
    id: "best-sellers", category: "items", icon: BarChart3, perm: P.reports.items, filters: ["period", "top"],
    run: (d, f) => {
      const ls = d.sales.filter((l) => inPeriod(l.date, f))
      const rows = [...groupBy(ls, (l) => l.productId).entries()].map(([id, g]) => ({ item: productName(d, Number(id)), qty: sum(g, (l) => l.qty), total: sum(g, total), invoices: new Set(g.map((l) => l.invoice)).size }))
        .sort((a, b) => b.qty - a.qty).slice(0, f.top ?? 10).map((x, i) => ({ rank: i + 1, ...x }))
      return {
        stats: [{ id: "topQty", value: rows[0]?.qty ?? 0, kind: "number", tone: "good" }, { id: "topSales", value: sum(rows, (x) => x.total), kind: "money" }],
        columns: [{ id: "rank", kind: "number" }, { id: "item", kind: "text", strong: true }, { id: "qty", kind: "number", strong: true }, { id: "invoices", kind: "number" }, { id: "total", kind: "money" }],
        rows,
      }
    },
  },
  {
    id: "item-movement", category: "items", icon: ArrowLeftRight, perm: P.reports.items, filters: ["period", "product"], requires: ["product"],
    run: (d, f) => {
      const id = f.productId
      const moves = [
        ...d.sales.filter((l) => l.productId === id).map((l) => ({ date: l.date, type: badge("t:reports.v.sale", "muted"), ref: l.invoice, in: 0, out: l.qty })),
        ...d.returns.filter((l) => l.productId === id).map((l) => ({ date: l.date, type: badge("t:reports.v.saleReturn", "warn"), ref: l.returnNo, in: l.qty, out: 0 })),
        ...d.purchases.filter((l) => l.productId === id).map((l) => ({ date: l.date, type: badge("t:reports.v.purchase", "good"), ref: l.invoice, in: l.qty, out: 0 })),
        ...d.adjustments.filter((a) => a.productId === id).map((a) => ({ date: a.date, type: badge("t:reports.v.adjustment", "bad"), ref: a.ref, in: Math.max(0, a.qty), out: Math.max(0, -a.qty) })),
        ...d.consumption.filter((c) => c.productId === id).map((c) => ({ date: c.date, type: badge("t:reports.v.consumption", "muted"), ref: c.ref, in: 0, out: c.qty })),
      ].sort((a, b) => a.date.localeCompare(b.date) || b.in - a.in) // within a day, goods arrive before they are sold
      const current = d.products.find((p) => p.id === id)?.balance ?? 0
      // Work back from today's balance so the running column ends at the real stock.
      let balance = r2(current - moves.reduce((a, m) => a + m.in - m.out, 0))
      const opening = r2(balance + moves.filter((m) => m.date < f.from).reduce((a, m) => a + m.in - m.out, 0))
      balance = opening
      const rows = moves.filter((m) => inPeriod(m.date, f)).map((m) => { balance = r2(balance + m.in - m.out); return { ...m, in: m.in || null, out: m.out || null, balance } })
      return {
        stats: [{ id: "openingQty", value: opening, kind: "number" }, { id: "qtyIn", value: sum(rows, (x) => Number(x.in ?? 0)), kind: "number", tone: "good" }, { id: "qtyOut", value: sum(rows, (x) => Number(x.out ?? 0)), kind: "number", tone: "bad" }, { id: "closingQty", value: balance, kind: "number" }],
        columns: [{ id: "date", kind: "date" }, { id: "type", kind: "badge" }, { id: "ref", kind: "text", strong: true }, { id: "in", kind: "number" }, { id: "out", kind: "number" }, { id: "balance", kind: "number", strong: true }],
        rows,
      }
    },
  },
  {
    id: "low-stock", category: "items", icon: TriangleAlert, perm: P.reports.items, filters: [],
    run: (d, f) => {
      const rows = d.products.filter((p) => p.balance != null && p.balance <= (p.minStockLevel ?? 0) && (!f.categoryId || p.categoryId === f.categoryId)).map((p) => ({
        item: p.productNameAr, category: categoryName(d, p.categoryId ?? 0), balance: p.balance ?? null, min: p.minStockLevel ?? 0, shortage: ((p.minStockLevel ?? 0) - (p.balance ?? 0)),
        suggested: Math.max((p.minStockLevel ?? 0) * 2 - (p.balance ?? 0), 0), state: p.balance === 0 ? badge("t:products.outOfStock", "bad") : badge("t:products.low", "warn"),
      }))
      return {
        stats: [{ id: "lowItems", value: rows.length, kind: "number", tone: rows.length ? "warn" : "good" }, { id: "outItems", value: rows.filter((r) => r.balance === 0).length, kind: "number", tone: "bad" }],
        columns: [{ id: "item", kind: "text", strong: true }, { id: "category", kind: "text" }, { id: "balance", kind: "number", strong: true }, { id: "min", kind: "number" }, { id: "shortage", kind: "number" }, { id: "suggested", kind: "number" }, { id: "state", kind: "badge" }],
        rows,
      }
    },
  },
  {
    id: "stock-balance", category: "items", icon: PackageSearch, perm: P.reports.items, filters: [],
    run: (d, f) => {
      const rows = d.products.filter((p) => p.balance != null && (!f.categoryId || p.categoryId === f.categoryId)).map((p) => ({
        item: p.productNameAr, category: categoryName(d, p.categoryId ?? 0), balance: p.balance ?? null, cost: p.costPrice ?? 0, costValue: r2((p.balance ?? 0) * (p.costPrice ?? 0)),
        price: p.sellingPrice || null, priceValue: p.sellingPrice ? r2((p.balance ?? 0) * p.sellingPrice) : null,
      })).sort((a, b) => b.costValue - a.costValue)
      return {
        stats: [{ id: "itemsCount", value: rows.length, kind: "number" }, { id: "stockCost", value: sum(rows, (x) => x.costValue), kind: "money" }, { id: "stockPrice", value: sum(rows, (x) => Number(x.priceValue ?? 0)), kind: "money", tone: "good" }],
        columns: [{ id: "item", kind: "text", strong: true }, { id: "category", kind: "text" }, { id: "balance", kind: "number" }, { id: "cost", kind: "money" }, { id: "costValue", kind: "money", strong: true }, { id: "price", kind: "money" }, { id: "priceValue", kind: "money" }],
        rows, totals: { item: "", costValue: sum(rows, (x) => x.costValue), priceValue: sum(rows, (x) => Number(x.priceValue ?? 0)) },
      }
    },
  },

  // ───────────── Purchases ─────────────
  {
    id: "purchases-by-invoice", category: "purchases", icon: Receipt, perm: P.reports.purchases, filters: ["period"],
    run: (d, f) => {
      const rows = invoicesOf(d.purchases.filter((l) => inPeriod(l.date, f) && (!f.supplierId || l.supplierId === f.supplierId)))
        .map((i) => ({ invoice: i.invoice, date: i.first.date, supplier: supplierName(i.first.supplierId), lines: i.ls.length, net: i.net, tax: i.tax, total: r2(i.net + i.tax) }))
        .sort((a, b) => b.date.localeCompare(a.date))
      return {
        stats: [{ id: "invoices", value: rows.length, kind: "number" }, { id: "totalPurchases", value: sum(rows, (x) => x.total), kind: "money" }, { id: "vat", value: sum(rows, (x) => x.tax), kind: "money" }],
        columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "supplier", kind: "text" }, { id: "lines", kind: "number" }, { id: "net", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { invoice: "", net: sum(rows, (x) => x.net), tax: sum(rows, (x) => x.tax), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "purchases-by-day", category: "purchases", icon: CalendarDays, perm: P.reports.purchases, filters: ["period"],
    run: (d, f) => {
      const rows = days(f).map((day) => {
        const ls = d.purchases.filter((l) => l.date === day)
        return { date: day, invoices: new Set(ls.map((l) => l.invoice)).size, net: sum(ls, (l) => l.net), tax: sum(ls, (l) => l.tax), total: sum(ls, total) }
      }).filter((x) => x.invoices > 0).reverse()
      return {
        stats: [{ id: "totalPurchases", value: sum(rows, (x) => x.total), kind: "money" }, { id: "purchaseDays", value: rows.length, kind: "number" }],
        columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "net", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { date: "", invoices: sum(rows, (x) => x.invoices), net: sum(rows, (x) => x.net), tax: sum(rows, (x) => x.tax), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "products-purchases", category: "purchases", icon: Boxes, perm: P.reports.purchases, filters: ["period"],
    run: (d, f) => {
      const ls = d.purchases.filter((l) => inPeriod(l.date, f))
      const rows = [...groupBy(ls, (l) => l.productId).entries()]
        .map(([id, g]) => ({ item: productName(d, Number(id)), qty: sum(g, (l) => l.qty), total: sum(g, total) }))
        .sort((a, b) => b.total - a.total)
      return {
        stats: [{ id: "itemsBought", value: rows.length, kind: "number" }, { id: "qtyBought", value: sum(rows, (x) => x.qty), kind: "number" }, { id: "totalPurchases", value: sum(rows, (x) => x.total), kind: "money" }],
        columns: [{ id: "item", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { item: "", qty: sum(rows, (x) => x.qty), total: sum(rows, (x) => x.total) },
      }
    },
  },
  {
    id: "item-purchases", category: "purchases", icon: ShoppingBag, perm: P.reports.purchases, filters: ["period", "product"], requires: ["product"],
    run: (d, f) => {
      const ls = d.purchases.filter((l) => inPeriod(l.date, f) && l.productId === f.productId)
      const rows = ls.map((l) => ({ date: l.date, invoice: l.invoice, supplier: supplierName(l.supplierId), qty: l.qty, cost: r2(l.net / l.qty), total: r2(total(l)) })).sort((a, b) => b.date.localeCompare(a.date))
      const qty = sum(ls, (l) => l.qty)
      return {
        stats: [{ id: "qtyBought", value: qty, kind: "number" }, { id: "totalPurchases", value: sum(ls, total), kind: "money" }, { id: "avgCost", value: qty ? r2(sum(ls, (l) => l.net) / qty) : 0, kind: "money" }],
        columns: [{ id: "date", kind: "date" }, { id: "invoice", kind: "text", strong: true }, { id: "supplier", kind: "text" }, { id: "qty", kind: "number" }, { id: "cost", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { date: "", qty, total: sum(rows, (x) => x.total) },
      }
    },
  },

  // ───────────── Customers ─────────────
  {
    id: "customer-statement", category: "customers", icon: UserRound, perm: P.reports.customers, filters: ["period", "customer"], requires: ["customer"],
    run: (d, f) => {
      const id = f.customerId
      const inv = invoicesOf(d.sales.filter((l) => l.customerId === id))
      const st = statement([
        ...inv.map((i) => ({ date: i.first.date, doc: i.invoice, desc: "t:reports.v.saleInvoice", debit: r2(i.net + i.tax), credit: 0 })),
        ...d.returns.filter((l) => l.customerId === id).map((l) => ({ date: l.date, doc: l.returnNo, desc: "t:reports.v.saleReturn", debit: 0, credit: r2(total(l)) })),
        ...d.receipts.filter((p) => p.partyId === id).map((p) => ({ date: p.date, doc: p.ref, desc: "t:reports.v.receipt", debit: 0, credit: p.amount })),
      ], f)
      return {
        stats: [{ id: "opening", value: st.opening, kind: "money" }, { id: "debit", value: st.debit, kind: "money" }, { id: "credit", value: st.credit, kind: "money" }, { id: "closing", value: st.closing, kind: "money", tone: st.closing > 0 ? "warn" : "good" }],
        columns: [{ id: "date", kind: "date" }, { id: "doc", kind: "text", strong: true }, { id: "desc", kind: "text" }, { id: "debit", kind: "money" }, { id: "credit", kind: "money" }, { id: "balance", kind: "money", strong: true }],
        rows: st.rows, totals: { date: "", debit: st.debit, credit: st.credit, balance: st.closing },
      }
    },
  },
  {
    id: "customers-balances", category: "customers", icon: Users, perm: P.reports.customers, filters: ["period"],
    run: (d, f) => {
      const rows = [...new Set(d.sales.map((l) => l.customerId))].map((id) => ({ id, name: customerName(id), phone: "" })).map((c) => {
        const sales = sum(d.sales.filter((l) => l.customerId === c.id && inPeriod(l.date, f)), total)
        const paid = c.id === 1 ? sales : sum(d.receipts.filter((p) => p.partyId === c.id && inPeriod(p.date, f)), (p) => p.amount)
        return { customer: c.name, phone: c.phone || "—", invoices: new Set(d.sales.filter((l) => l.customerId === c.id && inPeriod(l.date, f)).map((l) => l.invoice)).size, sales, paid, balance: r2(sales - paid) }
      }).filter((r) => r.invoices > 0).sort((a, b) => b.sales - a.sales)
      return {
        stats: [{ id: "activeCustomers", value: rows.length, kind: "number" }, { id: "totalSales", value: sum(rows, (x) => x.sales), kind: "money" }, { id: "receivables", value: sum(rows, (x) => Math.max(0, x.balance)), kind: "money", tone: "warn" }],
        columns: [{ id: "customer", kind: "text", strong: true }, { id: "phone", kind: "text" }, { id: "invoices", kind: "number" }, { id: "sales", kind: "money" }, { id: "paid", kind: "money" }, { id: "balance", kind: "money", strong: true }],
        rows, totals: { customer: "", invoices: sum(rows, (x) => x.invoices), sales: sum(rows, (x) => x.sales), paid: sum(rows, (x) => x.paid), balance: sum(rows, (x) => x.balance) },
      }
    },
  },

  // ───────────── Suppliers ─────────────
  {
    id: "supplier-statement", category: "suppliers", icon: Truck, perm: P.reports.suppliers, filters: ["period", "supplier"], requires: ["supplier"],
    run: (d, f) => {
      const id = f.supplierId
      const st = statement([
        ...invoicesOf(d.purchases.filter((l) => l.supplierId === id)).map((i) => ({ date: i.first.date, doc: i.invoice, desc: "t:reports.v.purchaseInvoice", debit: 0, credit: r2(i.net + i.tax) })),
        ...d.supplierPayments.filter((p) => p.partyId === id).map((p) => ({ date: p.date, doc: p.ref, desc: "t:reports.v.payment", debit: p.amount, credit: 0 })),
      ], f)
      // Supplier balances read as "we owe": flip the sign so a positive number is payable.
      const flip = (n: number) => r2(-n)
      return {
        stats: [{ id: "opening", value: flip(st.opening), kind: "money" }, { id: "purchasesCredit", value: st.credit, kind: "money" }, { id: "payments", value: st.debit, kind: "money" }, { id: "payable", value: flip(st.closing), kind: "money", tone: "warn" }],
        columns: [{ id: "date", kind: "date" }, { id: "doc", kind: "text", strong: true }, { id: "desc", kind: "text" }, { id: "debit", kind: "money" }, { id: "credit", kind: "money" }, { id: "balance", kind: "money", strong: true }],
        rows: st.rows.map((r) => ({ ...r, balance: flip(Number(r.balance)) })), totals: { date: "", debit: st.debit, credit: st.credit, balance: flip(st.closing) },
      }
    },
  },

  // ───────────── Expenses ─────────────
  {
    id: "expenses-detail", category: "expenses", icon: Wallet, perm: P.reports.expenses, filters: ["period"],
    run: (d, f) => {
      const ex = d.expenses.filter((e) => inPeriod(e.date, f))
      const treasury = (id: number) => `#${id}`
      const rows = ex.map((e) => ({ date: e.date, expenseItem: e.item, notes: e.notes || "—", treasury: treasury(e.treasuryId), amount: e.amount, tax: e.tax, total: r2(e.amount + e.tax) })).sort((a, b) => b.date.localeCompare(a.date))
      const byItem = [...groupBy(ex, (e) => e.item).entries()].map(([k, g]) => ({ label: String(k), value: sum(g, (e) => e.amount + e.tax) })).sort((a, b) => b.value - a.value)
      return {
        stats: [{ id: "totalExpenses", value: sum(rows, (x) => x.total), kind: "money", tone: "bad" }, { id: "vat", value: sum(rows, (x) => x.tax), kind: "money" }, { id: "biggestItem", value: byItem[0]?.value ?? 0, kind: "money" }],
        columns: [{ id: "date", kind: "date" }, { id: "expenseItem", kind: "text", strong: true }, { id: "notes", kind: "text" }, { id: "treasury", kind: "text" }, { id: "amount", kind: "money" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }],
        rows, totals: { date: "", amount: sum(rows, (x) => x.amount), tax: sum(rows, (x) => x.tax), total: sum(rows, (x) => x.total) },
      }
    },
  },

  // ───────────── Profits ─────────────
  {
    id: "profit", category: "profits", icon: ClipboardList, perm: P.reports.profits, filters: ["period"],
    run: (d, f) => {
      const inCat = (pid: number) => !f.categoryId || d.products.find((p) => p.id === pid)?.categoryId === f.categoryId
      const s = d.sales.filter((l) => inPeriod(l.date, f) && inCat(l.productId)), r = d.returns.filter((l) => inPeriod(l.date, f) && inCat(l.productId))
      const revenue = r2(sum(s, (l) => l.net) - sum(r, (l) => l.net)), cogs = r2(sum(s, (l) => l.cost) - sum(r, (l) => l.cost))
      const gross = r2(revenue - cogs)
      const expenses = f.categoryId ? 0 : sum(d.expenses.filter((e) => inPeriod(e.date, f)), (e) => e.amount)
      const rows = [...groupBy(s, (l) => d.products.find((p) => p.id === l.productId)?.categoryId ?? 0).entries()].map(([cid, g]) => {
        const rev = sum(g, (l) => l.net), cost = sum(g, (l) => l.cost)
        return { category: categoryName(d, Number(cid)), revenue: rev, cost, profit: r2(rev - cost), margin: rev ? r2(((rev - cost) / rev) * 100) : 0 }
      }).sort((a, b) => b.profit - a.profit)
      return {
        stats: [
          { id: "revenue", value: revenue, kind: "money" }, { id: "cogs", value: cogs, kind: "money" },
          { id: "grossProfit", value: gross, kind: "money", tone: gross >= 0 ? "good" : "bad" },
          ...(f.categoryId ? [] : [{ id: "expensesTotal", value: expenses, kind: "money" as const }, { id: "netProfit", value: r2(gross - expenses), kind: "money" as const, tone: (gross - expenses >= 0 ? "good" : "bad") as Tone }]),
        ],
        columns: [{ id: "category", kind: "text", strong: true }, { id: "revenue", kind: "money" }, { id: "cost", kind: "money" }, { id: "profit", kind: "money", strong: true }, { id: "margin", kind: "percent" }],
        rows, totals: { category: "", revenue: sum(rows, (x) => x.revenue), cost: sum(rows, (x) => x.cost), profit: sum(rows, (x) => x.profit), margin: revenue ? r2((gross / revenue) * 100) : 0 },
      }
    },
  },
]

export const reportById = (id: string | undefined) => REPORTS.find((r) => r.id === id)
