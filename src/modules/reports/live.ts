import { productsApi } from "@/modules/products/service"
import * as api from "./api"
import { GUIDE, GUIDE_SALES } from "./liveGuide"
import type { Cell, Filters, ReportResult, Row } from "./types"

/**
 * Reports read from the server: report id -> the function that fetches it and shapes it into the same
 * tiles / table the report page already renders. Reports not listed here still run on the sample data.
 * Column labels are the i18n keys "reports.c.<id>", tile labels "reports.k.<id>".
 */
const r2 = (n: number) => Math.round(n * 100) / 100
const sum = <T,>(xs: T[], f: (x: T) => number) => r2(xs.reduce((a, x) => a + (f(x) || 0), 0))
const byDate = <T extends { date: string }>(xs: T[]) => [...xs].sort((a, b) => a.date.localeCompare(b.date))

/** Payment status words from the server, as a coloured badge. */
const PAID = new Set(["paid", "مدفوع", "مدفوعة"])
const UNPAID = new Set(["unpaid", "غير مدفوع", "غير مدفوعة"])
function status(value: string): Cell {
  const v = (value ?? "").trim()
  if (!v) return null
  const k = v.toLowerCase()
  return { text: v, tone: PAID.has(k) ? "good" : UNPAID.has(k) ? "bad" : "warn" }
}

const none = (): ReportResult => ({ stats: [], columns: [], rows: [] })

const needsProduct = (f: Filters) => f.productId

type Live = (f: Filters) => Promise<ReportResult>

export const LIVE: Record<string, Live> = {
  "sales-by-day": async (f) => {
    const rows = byDate(await api.dailySales(f)).reverse()
    const total = sum(rows, (x) => x.netSales)
    const best = Math.max(0, ...rows.map((x) => x.netSales))
    return {
      stats: [{ id: "totalSales", value: total, kind: "money" }, { id: "dailyAvg", value: rows.length ? r2(total / rows.length) : 0, kind: "money" }, { id: "bestDay", value: best, kind: "money", tone: "good" }],
      columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "gross", kind: "money" }, { id: "discount", kind: "money" }, { id: "tax", kind: "money" }, { id: "netTotal", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.date, invoices: x.totalInvoices, gross: x.totalSales, discount: x.totalDiscount, tax: x.totalTax, netTotal: x.netSales })),
      totals: { date: "", invoices: sum(rows, (x) => x.totalInvoices), gross: sum(rows, (x) => x.totalSales), discount: sum(rows, (x) => x.totalDiscount), tax: sum(rows, (x) => x.totalTax), netTotal: total },
    }
  },

  "sales-by-invoice": async (f) => {
    const rows = (await api.salesInvoices(f)).sort((a, b) => b.date.localeCompare(a.date))
    return {
      stats: [{ id: "invoices", value: rows.length, kind: "number" }, { id: "totalSales", value: sum(rows, (x) => x.grandTotal), kind: "money" }, { id: "avgInvoice", value: rows.length ? r2(sum(rows, (x) => x.grandTotal) / rows.length) : 0, kind: "money" }],
      columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "customer", kind: "text" }, { id: "discount", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "paid", kind: "money" }, { id: "remaining", kind: "money" }, { id: "state", kind: "badge" }],
      rows: rows.map((x) => ({ invoice: x.orderNumber, date: x.date, customer: x.customerName, discount: x.discountAmount, total: x.grandTotal, paid: x.paidAmount, remaining: x.remainingAmount, state: status(x.paymentStatus) })),
      totals: { invoice: "", discount: sum(rows, (x) => x.discountAmount), total: sum(rows, (x) => x.grandTotal), paid: sum(rows, (x) => x.paidAmount), remaining: sum(rows, (x) => x.remainingAmount) },
    }
  },

  "products-sales": async (f) => {
    const { details, summary } = await api.productsSales(f)
    const rows = [...details].sort((a, b) => b.totalSales - a.totalSales)
    const total = summary?.grandTotalSales ?? sum(rows, (x) => x.totalSales)
    return {
      stats: [{ id: "itemsSold", value: rows.length, kind: "number" }, { id: "totalSales", value: total, kind: "money" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "barcode", kind: "text" }, { id: "invoices", kind: "number" }, { id: "total", kind: "money", strong: true }, { id: "share", kind: "percent" }],
      rows: rows.map((x) => ({ item: x.productName, barcode: x.barcode, invoices: x.salesCount, total: x.totalSales, share: total ? (x.totalSales / total) * 100 : 0 })),
      totals: { item: "", invoices: sum(rows, (x) => x.salesCount), total },
    }
  },

  "item-sales": async (f) => {
    if (!needsProduct(f)) return none()
    // The server looks an item up by its code, not its id.
    const product = await productsApi.get(f.productId!)
    const { details, summary } = await api.itemSales(f, product.productCode ?? 0)
    return {
      stats: [{ id: "qtySold", value: summary?.totalQuantitySold ?? sum(details, (x) => x.quantitySold), kind: "number" }, { id: "totalSales", value: summary?.totalSales ?? sum(details, (x) => x.totalSales), kind: "money" }, { id: "invoices", value: summary?.totalOperations ?? details.length, kind: "number" }],
      columns: [{ id: "date", kind: "date" }, { id: "invoice", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }, { id: "purchaseCost", kind: "money" }],
      rows: byDate(details).reverse().map((x) => ({ date: x.date, invoice: x.orderNumber, qty: x.quantitySold, total: x.totalSales, purchaseCost: x.totalPurchases })),
      totals: { date: "", qty: sum(details, (x) => x.quantitySold), total: sum(details, (x) => x.totalSales), purchaseCost: sum(details, (x) => x.totalPurchases) },
    }
  },

  "employee-sales": async (f) => {
    const orders = await api.employeeSales(f, f.employeeId)
    const groups = new Map<string, { employee: string; invoices: number; total: number }>()
    for (const o of orders) {
      const g = groups.get(String(o.employeeId)) ?? { employee: o.employeeName, invoices: 0, total: 0 }
      g.invoices += 1; g.total = r2(g.total + o.grandTotal)
      groups.set(String(o.employeeId), g)
    }
    const rows = [...groups.values()].sort((a, b) => b.total - a.total)
    return {
      stats: [{ id: "employees", value: rows.length, kind: "number" }, { id: "totalSales", value: sum(rows, (x) => x.total), kind: "money" }, { id: "invoices", value: orders.length, kind: "number" }],
      columns: [{ id: "employee", kind: "text", strong: true }, { id: "invoices", kind: "number" }, { id: "total", kind: "money", strong: true }, { id: "avg", kind: "money" }],
      rows: rows.map((x) => ({ ...x, avg: x.invoices ? r2(x.total / x.invoices) : 0 })),
      totals: { employee: "", invoices: orders.length, total: sum(rows, (x) => x.total) },
    }
  },

  "sales-returns": async (f) => {
    const rows = (await api.salesReturns(f)).sort((a, b) => b.returnDate.localeCompare(a.returnDate))
    return {
      stats: [{ id: "returnsCount", value: rows.length, kind: "number" }, { id: "returns", value: sum(rows, (x) => x.grandTotal), kind: "money", tone: "bad" }],
      columns: [{ id: "return", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "customer", kind: "text" }, { id: "tax", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "refunded", kind: "money" }, { id: "user", kind: "text" }],
      rows: rows.map((x) => ({ return: x.returnNumber, date: x.returnDate, customer: x.customerName, tax: x.taxAmount, total: x.grandTotal, refunded: x.refundedAmount, user: x.createdBy })),
      totals: { return: "", tax: sum(rows, (x) => x.taxAmount), total: sum(rows, (x) => x.grandTotal), refunded: sum(rows, (x) => x.refundedAmount) },
    }
  },

  "best-sellers": async (f) => {
    const rows = (await api.topSelling(f)).sort((a, b) => b.totalQuantitySold - a.totalQuantitySold).slice(0, f.top ?? 10)
    return {
      stats: [{ id: "topQty", value: rows[0]?.totalQuantitySold ?? 0, kind: "number", tone: "good" }, { id: "topSales", value: sum(rows, (x) => x.totalSales), kind: "money" }],
      columns: [{ id: "rank", kind: "number" }, { id: "item", kind: "text", strong: true }, { id: "qty", kind: "number", strong: true }, { id: "total", kind: "money" }],
      rows: rows.map((x, i) => ({ rank: i + 1, item: x.productName, qty: x.totalQuantitySold, total: x.totalSales })),
    }
  },

  "item-movement": async (f) => {
    if (!needsProduct(f)) return none()
    const list = (await api.movement(f, f.productId!)).sort((a, b) => a.transDate.localeCompare(b.transDate))
    const rows: Row[] = list.map((m) => ({ date: m.transDate, type: { text: m.transType, tone: "muted" as const }, ref: String(m.invoiceNo ?? ""), in: m.qtyIn || null, out: m.qtyOut || null, balance: m.runningBalance }))
    const first = list[0]
    return {
      stats: [
        { id: "openingQty", value: first ? r2(first.runningBalance - first.qtyIn + first.qtyOut) : 0, kind: "number" },
        { id: "qtyIn", value: sum(list, (x) => x.qtyIn), kind: "number", tone: "good" },
        { id: "qtyOut", value: sum(list, (x) => x.qtyOut), kind: "number", tone: "bad" },
        { id: "closingQty", value: list.at(-1)?.runningBalance ?? 0, kind: "number" },
      ],
      columns: [{ id: "date", kind: "date" }, { id: "type", kind: "badge" }, { id: "ref", kind: "text", strong: true }, { id: "in", kind: "number" }, { id: "out", kind: "number" }, { id: "balance", kind: "number", strong: true }],
      rows,
    }
  },

  "low-stock": async () => {
    const list = await api.stockAlerts()
    const rows = list.map((x) => ({ item: x.productName, balance: x.currentQty, min: x.minStockLevel, shortage: Math.max(0, r2(x.minStockLevel - x.currentQty)), state: x.currentQty <= 0 ? { text: "t:reports.v.outOfStock", tone: "bad" as const } : { text: "t:reports.v.low", tone: "warn" as const } }))
      .sort((a, b) => a.balance - b.balance)
    return {
      stats: [{ id: "lowItems", value: rows.length, kind: "number", tone: rows.length ? "warn" : "good" }, { id: "outItems", value: rows.filter((x) => x.balance <= 0).length, kind: "number", tone: "bad" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "balance", kind: "number", strong: true }, { id: "min", kind: "number" }, { id: "shortage", kind: "number" }, { id: "state", kind: "badge" }],
      rows,
    }
  },

  "stock-balance": async () => {
    const { rows: items, first } = await api.inventoryStock()
    return {
      stats: [{ id: "itemsCount", value: first?.totalCount ?? items.length, kind: "number" }, { id: "stockCost", value: first?.totalCost ?? sum(items, (x) => x.totalCostValue), kind: "money" }, { id: "stockPrice", value: first?.totalSale ?? sum(items, (x) => x.totalSaleValue), kind: "money" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "balance", kind: "number" }, { id: "cost", kind: "money" }, { id: "costValue", kind: "money", strong: true }, { id: "price", kind: "money" }, { id: "priceValue", kind: "money" }],
      rows: items.map((x) => ({ item: x.productName, balance: x.currentQty, cost: x.costPrice, costValue: x.totalCostValue, price: x.salePrice, priceValue: x.totalSaleValue })),
      totals: { item: "", costValue: first?.totalCost ?? sum(items, (x) => x.totalCostValue), priceValue: first?.totalSale ?? sum(items, (x) => x.totalSaleValue) },
    }
  },

  "purchases-by-day": async (f) => {
    const rows = byDate(await api.dailyPurchases(f)).reverse()
    const total = sum(rows, (x) => x.netPurchases)
    return {
      stats: [{ id: "totalPurchases", value: total, kind: "money" }, { id: "purchaseDays", value: rows.length, kind: "number" }],
      columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "gross", kind: "money" }, { id: "discount", kind: "money" }, { id: "netTotal", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.date, invoices: x.totalInvoices, gross: x.totalPurchases, discount: x.totalDiscount, netTotal: x.netPurchases })),
      totals: { date: "", invoices: sum(rows, (x) => x.totalInvoices), gross: sum(rows, (x) => x.totalPurchases), discount: sum(rows, (x) => x.totalDiscount), netTotal: total },
    }
  },

  "purchases-by-invoice": async (f) => {
    const rows = (await api.purchaseInvoices(f)).sort((a, b) => b.date.localeCompare(a.date))
    return {
      stats: [{ id: "invoices", value: rows.length, kind: "number" }, { id: "totalPurchases", value: sum(rows, (x) => x.grandTotal), kind: "money" }],
      columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "supplier", kind: "text" }, { id: "discount", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "paid", kind: "money" }, { id: "remaining", kind: "money" }, { id: "state", kind: "badge" }],
      rows: rows.map((x) => ({ invoice: x.orderNumber, date: x.date, supplier: x.supplierName, discount: x.discountAmount, total: x.grandTotal, paid: x.paidAmount, remaining: x.remainingAmount, state: status(x.paymentStatus) })),
      totals: { invoice: "", discount: sum(rows, (x) => x.discountAmount), total: sum(rows, (x) => x.grandTotal), paid: sum(rows, (x) => x.paidAmount), remaining: sum(rows, (x) => x.remainingAmount) },
    }
  },

  "item-purchases": async (f) => {
    if (!needsProduct(f)) return none()
    const { details, summary } = await api.itemPurchases(f, f.productId!)
    return {
      stats: [{ id: "qtyBought", value: summary?.totalQuantityPurchased ?? sum(details, (x) => x.quantityPurchased), kind: "number" }, { id: "totalPurchases", value: summary?.totalPurchases ?? sum(details, (x) => x.totalPurchases), kind: "money" }],
      columns: [{ id: "date", kind: "date" }, { id: "invoice", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }],
      rows: byDate(details).reverse().map((x) => ({ date: x.date, invoice: x.orderNumber, qty: x.quantityPurchased, total: x.totalPurchases })),
      totals: { date: "", qty: sum(details, (x) => x.quantityPurchased), total: sum(details, (x) => x.totalPurchases) },
    }
  },

  "customer-statement": async (f) => statementResult(f.customerId ? await api.customerStatement(f, f.customerId) : undefined),
  "supplier-statement": async (f) => statementResult(f.supplierId ? await api.supplierStatement(f, f.supplierId) : undefined),

  "expenses-detail": async (f) => {
    const { rows: list, first } = await api.expenses(f)
    const rows = list.sort((a, b) => b.date.localeCompare(a.date))
    const total = first?.totalAmount ?? sum(rows, (x) => x.amount)
    return {
      stats: [{ id: "totalExpenses", value: total, kind: "money", tone: "bad" }],
      columns: [{ id: "date", kind: "date" }, { id: "expenseItem", kind: "text", strong: true }, { id: "notes", kind: "text" }, { id: "treasury", kind: "text" }, { id: "amount", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.date, expenseItem: x.itemName ?? "—", notes: x.notes, treasury: x.treasuryName, amount: x.amount })),
      totals: { date: "", amount: total },
    }
  },

  profit: async (f) => {
    const p = await api.profit(f)
    return {
      stats: [{ id: "revenue", value: p.totalSales, kind: "money" }, { id: "cogs", value: p.totalCostOfSales, kind: "money" }, { id: "grossProfit", value: p.grossProfit, kind: "money", tone: "good" }, { id: "expensesTotal", value: p.totalExpenses, kind: "money" }, { id: "netProfit", value: p.netProfit, kind: "money", tone: p.netProfit < 0 ? "bad" : "good" }],
      columns: [{ id: "revenue", kind: "money" }, { id: "cost", kind: "money" }, { id: "profit", kind: "money", strong: true }, { id: "expenses", kind: "money" }, { id: "netProfit", kind: "money", strong: true }, { id: "margin", kind: "percent" }],
      rows: [{ revenue: p.totalSales, cost: p.totalCostOfSales, profit: p.grossProfit, expenses: p.totalExpenses, netProfit: p.netProfit, margin: p.totalSales ? (p.netProfit / p.totalSales) * 100 : 0 }],
    }
  },
}

// Reports whose endpoints follow the back end guide replace the older entries above.
Object.assign(LIVE, GUIDE, GUIDE_SALES)

/** A customer or supplier account: opening balance, the movements, the closing balance. */
function statementResult(s: { rows: api.StatementRow[]; first: api.Statement } | undefined): ReportResult {
  if (!s) return none()
  const { rows: list, first } = s
  return {
    stats: [{ id: "opening", value: first?.openingBalance ?? 0, kind: "money" }, { id: "debit", value: first?.totalDebit ?? sum(list, (x) => x.debit), kind: "money" }, { id: "credit", value: first?.totalCredit ?? sum(list, (x) => x.credit), kind: "money" }, { id: "closing", value: first?.closingBalance ?? list.at(-1)?.balance ?? 0, kind: "money", tone: "good" }],
    columns: [{ id: "date", kind: "date" }, { id: "doc", kind: "text", strong: true }, { id: "desc", kind: "text" }, { id: "debit", kind: "money" }, { id: "credit", kind: "money" }, { id: "balance", kind: "money", strong: true }],
    rows: list.map((x) => ({ date: x.date, doc: x.reference, desc: x.type, debit: x.debit || null, credit: x.credit || null, balance: x.balance })),
  }
}
