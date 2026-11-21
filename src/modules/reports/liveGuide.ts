import * as api from "./old/api"
import { productsApi } from "@/modules/products/service"
import { currentBranchId } from "@/shared/auth/currentBranchId"
import type { Cell, Filters, ReportResult, Row } from "./types"

/**
 * Reports read from the server in the shapes of the back end's reports guide (`items` + paging fields + totals).
 * Same tile / table contract as `live.ts`; these entries replace the ones there for the same report ids.
 * Column labels are "reports.c.<id>", tile labels "reports.k.<id>".
 */
const none = (): ReportResult => ({ stats: [], columns: [], rows: [] })
const branch = () => ({ branchid: currentBranchId() })

type Item<R> = R extends { items: (infer T)[] } ? T : never

/** Reads a paged report to the end (200 rows per request, at most 50 requests); `first` carries the totals. */
async function every<R extends { items: unknown[]; totalCount: number }>(read: (page: number, size: number) => Promise<R>): Promise<{ rows: Item<R>[]; first: R }> {
  const rows: Item<R>[] = []
  let first: R | undefined
  for (let page = 1; page <= 50; page++) {
    const r = await read(page, 200)
    first ??= r
    rows.push(...(r.items as Item<R>[]))
    if (!r.items.length || rows.length >= r.totalCount) break
  }
  return { rows, first: first as R }
}

const stmt = (s: { rows: api.StatementRow[]; first: api.Statement } | undefined): ReportResult => {
  if (!s) return none()
  const { rows, first } = s
  return {
    stats: [{ id: "opening", value: first?.openingBalance ?? 0, kind: "money" }, { id: "debit", value: first?.totalDebit ?? 0, kind: "money" }, { id: "credit", value: first?.totalCredit ?? 0, kind: "money" }, { id: "closing", value: first?.closingBalance ?? 0, kind: "money", tone: "good" }],
    columns: [{ id: "date", kind: "date" }, { id: "doc", kind: "text", strong: true }, { id: "desc", kind: "text" }, { id: "debit", kind: "money" }, { id: "credit", kind: "money" }, { id: "balance", kind: "money", strong: true }],
    rows: rows.map((x) => ({ date: x.date, doc: x.docNumber, desc: x.transactionType, debit: x.debit || null, credit: x.credit || null, balance: x.balance })),
  }
}

export const GUIDE: Record<string, (f: Filters) => Promise<ReportResult>> = {
  "products-purchases": async (f) => {
    const { details, summary } = await api.productsPurchases({ ...branch(), from: f.from, to: f.to, SortBy: "totalpurchases", SortDescending: true })
    const qty = details.reduce((a, x) => a + x.purchasesCount, 0)
    return {
      stats: [{ id: "itemsBought", value: details.length, kind: "number" }, { id: "qtyBought", value: qty, kind: "number" }, { id: "totalPurchases", value: summary.grandTotalPurchases, kind: "money" }],
      columns: [{ id: "barcode", kind: "text" }, { id: "item", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }],
      rows: details.map((x) => ({ barcode: x.barcode, item: x.productName, qty: x.purchasesCount, total: x.totalPurchases })),
      totals: { barcode: "", item: "", qty, total: summary.grandTotalPurchases },
    }
  },

  "purchases-by-day": async (f) => {
    const { rows, first } = await every((Page, PageSize) => api.dailyPurchases({ ...branch(), from: f.from, to: f.to, Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "totalPurchases", value: t?.netPurchases ?? 0, kind: "money" }, { id: "purchaseDays", value: first?.totalCount ?? 0, kind: "number" }],
      columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "gross", kind: "money" }, { id: "discount", kind: "money" }, { id: "netTotal", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.date, invoices: x.totalInvoices, gross: x.totalPurchases, discount: x.totalDiscount, netTotal: x.netPurchases })),
      totals: { date: "", invoices: t?.totalInvoices ?? 0, gross: t?.totalPurchases ?? 0, discount: t?.totalDiscount ?? 0, netTotal: t?.netPurchases ?? 0 },
    }
  },

  "purchases-by-invoice": async (f) => {
    const { rows, first } = await every((Page, PageSize) => api.purchaseInvoices({ ...branch(), from: f.from, to: f.to, Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "invoices", value: t?.totalInvoices ?? 0, kind: "number" }, { id: "totalPurchases", value: t?.grandTotal ?? 0, kind: "money" }],
      columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "supplier", kind: "text" }, { id: "discount", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "paid", kind: "money" }, { id: "remaining", kind: "money" }],
      rows: rows.map((x) => ({ invoice: x.invoiceNumber, date: x.invoiceDate, supplier: x.supplierName, discount: x.discountAmount, total: x.grandTotal, paid: x.paidAmount, remaining: x.remainingAmount })),
      totals: { invoice: "", discount: t?.totalDiscount ?? 0, total: t?.grandTotal ?? 0, paid: t?.paidAmount ?? 0, remaining: t?.remainingAmount ?? 0 },
    }
  },

  "item-purchases": async (f) => {
    if (!f.productId) return none()
    const { rows, first } = await every((Page, PageSize) => api.productPurchases({ ...branch(), productID: f.productId!, from: f.from, to: f.to, Page, PageSize }))
    return {
      stats: [{ id: "qtyBought", value: first?.summary?.totalQuantity ?? 0, kind: "number" }, { id: "totalPurchases", value: first?.summary?.totalPurchasesCost ?? 0, kind: "money" }],
      columns: [{ id: "supplier", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "price", kind: "money" }, { id: "total", kind: "money", strong: true }],
      rows: rows.map((x) => ({ supplier: x.supplierName, qty: x.quantity, price: x.unitPrice, total: x.totalCost })),
      totals: { supplier: "", qty: first?.summary?.totalQuantity ?? 0, total: first?.summary?.totalPurchasesCost ?? 0 },
    }
  },

  "customer-statement": async (f) => stmt(f.customerId ? await every((Page, PageSize) => api.customerStatement({ customerId: f.customerId!, from: f.from, to: f.to, Page, PageSize })) : undefined),
  "supplier-statement": async (f) => stmt(f.supplierId ? await every((Page, PageSize) => api.supplierStatement({ supplierId: f.supplierId!, from: f.from, to: f.to, Page, PageSize })) : undefined),

  "expenses-detail": async (f) => {
    const list: api.ExpenseRow[] = []
    let total = 0
    for (let Page = 1; Page <= 50; Page++) {
      const r = await api.expensesReport({ ...branch(), fromDate: f.from, toDate: f.to, Page, PageSize: 200 })
      total = r.totalAmount
      list.push(...r.data)
      if (!r.data.length || list.length >= r.totalCount) break
    }
    return {
      stats: [{ id: "totalExpenses", value: total, kind: "money", tone: "bad" }],
      columns: [{ id: "date", kind: "date" }, { id: "expenseItem", kind: "text", strong: true }, { id: "notes", kind: "text" }, { id: "treasury", kind: "text" }, { id: "amount", kind: "money", strong: true }],
      rows: list.map((x) => ({ date: x.expenseDate, expenseItem: x.expenseTypeName || "—", notes: x.notes, treasury: x.treasuryName, amount: x.amount })),
      totals: { date: "", amount: total },
    }
  },

  profit: async (f) => {
    const p = await api.profitReport({ ...branch(), from: f.from, to: f.to })
    return {
      stats: [{ id: "revenue", value: p.totalSales, kind: "money" }, { id: "cogs", value: p.totalCost, kind: "money" }, { id: "grossProfit", value: p.grossProfit, kind: "money", tone: "good" }, { id: "expensesTotal", value: p.totalExpenses, kind: "money" }, { id: "netProfit", value: p.netProfit, kind: "money", tone: p.netProfit < 0 ? "bad" : "good" }],
      columns: [{ id: "revenue", kind: "money" }, { id: "cost", kind: "money" }, { id: "profit", kind: "money", strong: true }, { id: "expenses", kind: "money" }, { id: "netProfit", kind: "money", strong: true }, { id: "margin", kind: "percent" }],
      rows: [{ revenue: p.totalSales, cost: p.totalCost, profit: p.grossProfit, expenses: p.totalExpenses, netProfit: p.netProfit, margin: p.profitMargin }],
    }
  },

  "best-sellers": async (f) => {
    const items = await api.topSelling({ ...branch(), from: f.from, to: f.to, count: f.top ?? 10 })
    return {
      stats: [],
      columns: [{ id: "rank", kind: "number" }, { id: "item", kind: "text", strong: true }, { id: "barcode", kind: "text" }, { id: "price", kind: "money" }, { id: "qty", kind: "number", strong: true }, { id: "total", kind: "money" }],
      rows: items.map((x, i) => ({ rank: i + 1, item: x.productName, barcode: x.barcode, price: x.sellingPrice, qty: x.totalQuantitySold, total: x.totalSales })),
    }
  },

  "item-movement": async (f) => {
    if (!f.productId) return none()
    const { rows, first } = await every((Page, PageSize) => api.productMovement({ ...branch(), productId: f.productId!, from: f.from, to: f.to, Page, PageSize, SortBy: "transDate", SortDescending: false }))
    const t = first?.totals
    const list: Row[] = rows.map((m) => ({ date: m.transDate, type: { text: m.transType, tone: "muted" as const } as Cell, ref: String(m.invoiceNo ?? ""), in: m.qtyIn || null, out: m.qtyOut || null, balance: m.runningBalance }))
    return {
      stats: [
        { id: "qtyIn", value: t?.totalQtyIn ?? 0, kind: "number", tone: "good" },
        { id: "qtyOut", value: t?.totalQtyOut ?? 0, kind: "number", tone: "bad" },
        { id: "closingQty", value: t?.closingBalance ?? 0, kind: "number" },
      ],
      columns: [{ id: "date", kind: "date" }, { id: "type", kind: "badge" }, { id: "ref", kind: "text", strong: true }, { id: "in", kind: "number" }, { id: "out", kind: "number" }, { id: "balance", kind: "number", strong: true }],
      rows: list,
    }
  },

  "low-stock": async () => {
    const { rows, first } = await every((Page, PageSize) => api.stockAlerts({ ...branch(), Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "lowItems", value: t?.productsCount ?? rows.length, kind: "number", tone: rows.length ? "warn" : "good" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "balance", kind: "number", strong: true }, { id: "min", kind: "number" }, { id: "shortage", kind: "number" }, { id: "state", kind: "badge" }],
      rows: rows.map((x) => ({ item: x.productName, balance: x.currentQty, min: x.minStockLevel, shortage: x.shortageQty, state: x.currentQty <= 0 ? { text: "t:reports.v.outOfStock", tone: "bad" as const } : { text: "t:reports.v.low", tone: "warn" as const } })),
    }
  },

  "stock-balance": async () => {
    const { rows, first } = await every((Page, PageSize) => api.inventoryStock({ ...branch(), Page, PageSize }))
    return {
      stats: [{ id: "itemsCount", value: first?.totalCount ?? rows.length, kind: "number" }, { id: "stockCost", value: first?.totalCost ?? 0, kind: "money" }, { id: "stockPrice", value: first?.totalSale ?? 0, kind: "money" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "category", kind: "text" }, { id: "balance", kind: "number" }, { id: "cost", kind: "money" }, { id: "costValue", kind: "money", strong: true }, { id: "price", kind: "money" }, { id: "priceValue", kind: "money" }],
      rows: rows.map((x) => ({ item: x.productName, category: x.categoryName, balance: x.currentBalance, cost: x.costPrice, costValue: x.totalCost, price: x.salePrice, priceValue: x.totalSale })),
      totals: { item: "", costValue: first?.totalCost ?? 0, priceValue: first?.totalSale ?? 0 },
    }
  },
}

export const GUIDE_SALES: Record<string, (f: Filters) => Promise<ReportResult>> = {
  "sales-by-day": async (f) => {
    const { rows, first } = await every((Page, PageSize) => api.dailySales({ ...branch(), from: f.from, to: f.to, Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "totalSales", value: t?.netSales ?? 0, kind: "money" }],
      columns: [{ id: "date", kind: "date", strong: true }, { id: "invoices", kind: "number" }, { id: "gross", kind: "money" }, { id: "discount", kind: "money" }, { id: "tax", kind: "money" }, { id: "netTotal", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.date, invoices: x.totalInvoices, gross: x.totalSales, discount: x.totalDiscount, tax: x.totalTax, netTotal: x.netSales })),
      totals: { date: "", invoices: t?.totalInvoices ?? 0, gross: t?.totalSales ?? 0, discount: t?.totalDiscount ?? 0, tax: t?.totalTax ?? 0, netTotal: t?.netSales ?? 0 },
    }
  },

  "sales-by-invoice": async (f) => {
    const { rows, first } = await every((Page, PageSize) => api.salesInvoices({ ...branch(), from: f.from, to: f.to, Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "invoices", value: t?.totalInvoices ?? 0, kind: "number" }, { id: "totalSales", value: t?.finalTotal ?? 0, kind: "money" }],
      columns: [{ id: "invoice", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "customer", kind: "text" }, { id: "discount", kind: "money" }, { id: "total", kind: "money", strong: true }, { id: "paid", kind: "money" }, { id: "remaining", kind: "money" }, { id: "method", kind: "text" }],
      rows: rows.map((x) => ({ invoice: x.invoiceNumber, date: x.invoiceDate, customer: x.customerName, discount: x.discountAmount, total: x.grandTotal, paid: x.paidAmount, remaining: x.remainingAmount, method: x.paymentType })),
      totals: { invoice: "", discount: t?.totalDiscount ?? 0, total: t?.finalTotal ?? 0, paid: t?.totalPaid ?? 0, remaining: t?.totalRemaining ?? 0 },
    }
  },

  "products-sales": async (f) => {
    const { rows, first } = await every((Page, PageSize) => api.productsSales({ ...branch(), from: f.from, to: f.to, Page, PageSize }))
    const t = first?.totals
    return {
      stats: [{ id: "itemsSold", value: first?.totalCount ?? 0, kind: "number" }, { id: "qtySold", value: t?.totalQuantity ?? 0, kind: "number" }, { id: "totalSales", value: t?.totalSales ?? 0, kind: "money" }],
      columns: [{ id: "item", kind: "text", strong: true }, { id: "category", kind: "text" }, { id: "qty", kind: "number" }, { id: "total", kind: "money", strong: true }],
      rows: rows.map((x) => ({ item: x.productName, category: x.categoryName, qty: x.quantitySold, total: x.totalSales })),
      totals: { item: "", qty: t?.totalQuantity ?? 0, total: t?.totalSales ?? 0 },
    }
  },

  "item-sales": async (f) => {
    if (!f.productId) return none()
    // The server looks an item up by its code, not its id.
    const product = await productsApi.get(f.productId)
    const { rows, first } = await every((Page, PageSize) => api.itemSales({ ...branch(), productCode: product.productCode ?? 0, from: f.from, to: f.to, Page, PageSize }))
    const s = first?.summary
    return {
      stats: [{ id: "qtySold", value: s?.totalQuantity ?? 0, kind: "number" }, { id: "totalSales", value: s?.netTotal ?? 0, kind: "money" }, { id: "invoices", value: first?.totalCount ?? 0, kind: "number" }],
      columns: [{ id: "date", kind: "date" }, { id: "invoice", kind: "text", strong: true }, { id: "qty", kind: "number" }, { id: "price", kind: "money" }, { id: "total", kind: "money", strong: true }],
      rows: rows.map((x) => ({ date: x.invoiceDate, invoice: x.invoiceNumber, qty: x.quantity, price: x.unitPrice, total: x.netTotal })),
      totals: { date: "", qty: s?.totalQuantity ?? 0, total: s?.netTotal ?? 0 },
    }
  },

  "employee-sales": async (f) => {
    const r = await api.employeeSales({ BranchId: currentBranchId(), From: f.from, To: f.to, EmployeeId: f.employeeId })
    return {
      stats: [{ id: "totalSales", value: r.summary?.netSales ?? 0, kind: "money" }, { id: "invoices", value: r.summary?.totalInvoices ?? 0, kind: "number" }],
      columns: [{ id: "employee", kind: "text", strong: true }, { id: "invoices", kind: "number" }, { id: "sales", kind: "money" }, { id: "returns", kind: "money" }, { id: "netTotal", kind: "money", strong: true }],
      rows: r.items.map((x) => ({ employee: x.employeeName, invoices: x.invoicesCount, sales: x.totalSales, returns: x.totalReturns, netTotal: x.netSales })),
      totals: { employee: "", invoices: r.summary?.totalInvoices ?? 0, sales: r.summary?.totalSales ?? 0, returns: r.summary?.totalReturns ?? 0, netTotal: r.summary?.netSales ?? 0 },
    }
  },

  "sales-returns": async (f) => {
    const r = await api.salesReturns({ BranchId: currentBranchId(), From: f.from, To: f.to })
    return {
      stats: [{ id: "returnsCount", value: r.totalCount, kind: "number" }, { id: "returns", value: r.totalReturnAmount, kind: "money", tone: "bad" }],
      columns: [{ id: "return", kind: "text", strong: true }, { id: "date", kind: "date" }, { id: "invoice", kind: "text" }, { id: "customer", kind: "text" }, { id: "total", kind: "money", strong: true }, { id: "notes", kind: "text" }],
      rows: r.items.map((x) => ({ return: x.returnInvoiceNumber, date: x.returnDate, invoice: x.originalInvoiceNumber, customer: x.customerName, total: x.returnTotal, notes: x.reason })),
      totals: { return: "", total: r.totalReturnAmount },
    }
  },
}
