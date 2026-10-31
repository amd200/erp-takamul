import { http } from "@/shared/http/request"

/**
 * The server's report endpoints (GET /reports/products/*). Shapes follow what the Takamul web app already
 * reads from them. Endpoints that return a bare array send every row when no Page is given;
 * paged ones are read page by page by `allPages`.
 */
const BASE = "/reports/products"

export type Paged<T> = { items: T[]; totalCount: number; pageNumber: number; pageSize: number }

type Range = { from: string; to: string }
const get = <T,>(path: string, params: Record<string, unknown>) => http<T>(`${BASE}/${path}`, { params })

const PAGE = 200
const MAX_PAGES = 50

/** Reads a paged report to the end (a runaway total is cut at MAX_PAGES pages). */
async function allPages<T, R extends { totalCount: number }>(read: (page: number) => Promise<R>, items: (r: R) => T[]) {
  const rows: T[] = []
  let first: R | undefined
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await read(page)
    first ??= r
    const batch = items(r)
    rows.push(...batch)
    if (!batch.length || rows.length >= r.totalCount) break
  }
  return { rows, first: first as R }
}

// ── Sales ──
export type DailySalesRow = { date: string; totalInvoices: number; totalSales: number; totalDiscount: number; totalTax: number; netSales: number }
export const dailySales = (r: Range) => get<DailySalesRow[]>("DailySales", { from: r.from, to: r.to })

export type SalesInvoiceRow = { date: string; orderNumber: string; customerName: string; subTotal: number; discountAmount: number; grandTotal: number; paidAmount: number; remainingAmount: number; paymentStatus: string }
export const salesInvoices = (r: Range) => get<SalesInvoiceRow[]>("SalesInvoices", { from: r.from, to: r.to })

export type ProductsSalesResult = { details: { productName: string; barcode: string; salesCount: number; totalSales: number }[]; summary: { grandTotalSales: number } }
export const productsSales = (r: Range) => get<ProductsSalesResult>("ProductsSales", { from: r.from, to: r.to })

export type ItemSalesResult = { details: { date: string; orderNumber: string; quantitySold: number; totalSales: number; totalPurchases: number }[]; summary: { totalOperations: number; totalQuantitySold: number; totalSales: number; totalPurchases: number } }
export const itemSales = (r: Range, productCode: number | string) => get<ItemSalesResult>("ProductSalesForBrunch", { productCode, from: r.from, to: r.to })

export type EmployeeSaleRow = { employeeId: number; employeeName: string; orderNumber: string; orderDate: string; customerName: string; subTotal: number; discountAmount: number; taxAmount: number; grandTotal: number; orderStatus: string; paymentStatus: string }
export const employeeSales = (r: Range, employeeId?: number) =>
  allPages((Page) => get<{ items: EmployeeSaleRow[]; totalCount: number }>("employee-sales", { from: r.from, to: r.to, EmployeeId: employeeId, Page, PageSize: PAGE }), (x) => x.items).then((x) => x.rows)

export type SalesReturnRow = { returnId: number; returnNumber: string; returnDate: string; customerName: string; returnStatus: string; refundStatus: string; subTotal: number; discountAmount: number; taxAmount: number; grandTotal: number; refundedAmount: number; createdBy: string }
export const salesReturns = (r: Range) =>
  allPages((Page) => get<Paged<SalesReturnRow>>("SalesReturn", { from: r.from, to: r.to, Page, PageSize: PAGE }), (x) => x.items).then((x) => x.rows)

// ── Items ──
export type TopSellingRow = { productId: number; productName: string; barcode: string; sellingPrice: number; totalQuantitySold: number; totalSales: number }
export const topSelling = (r: Range) =>
  allPages((Page) => get<Paged<TopSellingRow>>("TopSelling", { from: r.from, to: r.to, Page, PageSize: PAGE }), (x) => x.items).then((x) => x.rows)

export type MovementRow = { productId: number; productNameAr: string; barcode: string; transDate: string; transType: string; qtyIn: number; qtyOut: number; invoiceNo: number | string; runningBalance: number }
export const movement = (r: Range, productId: number) => get<MovementRow[]>("movement", { productId, from: r.from, to: r.to })

export type StockAlertRow = { productId: number; productName: string; barcode: string; currentQty: number; minStockLevel: number }
export const stockAlerts = () => get<StockAlertRow[]>("StockAlerts", {})

export type StockRow = { productId: number; barcode: string; productName: string; unitName: string; currentQty: number; costPrice: number; salePrice: number; totalCostValue: number; totalSaleValue: number }
export type StockPage = Paged<StockRow> & { totalQty: number; totalCost: number; totalSale: number }
export const inventoryStock = () =>
  allPages((Page) => get<StockPage>("InventoryStock", { Page, PageSize: PAGE }), (x) => x.items)

// ── Purchases ──
export type DailyPurchasesRow = { date: string; totalInvoices: number; totalPurchases: number; totalDiscount: number; netPurchases: number }
export const dailyPurchases = (r: Range) => get<DailyPurchasesRow[]>("DailyPurchases", { from: r.from, to: r.to })

export type PurchaseInvoiceRow = { date: string; orderNumber: string; supplierName: string; subTotal: number; discountAmount: number; grandTotal: number; paidAmount: number; remainingAmount: number; paymentStatus: string }
export const purchaseInvoices = (r: Range) => get<PurchaseInvoiceRow[]>("PurchaseInvoices", { from: r.from, to: r.to })

export type ItemPurchasesResult = { details: { date: string; orderNumber: string; quantityPurchased: number; totalPurchases: number }[]; summary: { totalOperations: number; totalQuantityPurchased: number; totalPurchases: number } }
export const itemPurchases = (r: Range, productID: number) => get<ItemPurchasesResult>("ProductPurchases", { productID, from: r.from, to: r.to })

// ── Statements ──
export type StatementRow = { date: string; type: string; reference: string; debit: number; credit: number; balance: number }
export type Statement = Paged<StatementRow> & { totalDebit: number; totalCredit: number; openingBalance: number; closingBalance: number }
export const customerStatement = (r: Range, customerId: number) =>
  allPages((Page) => get<Statement>("CustomerStatement", { CustomerId: customerId, From: r.from, To: r.to, Page, PageSize: PAGE }), (x) => x.items)
export const supplierStatement = (r: Range, supplierId: number) =>
  allPages((Page) => get<Statement>("SupplierStatement", { SupplierId: supplierId, From: r.from, To: r.to, Page, PageSize: PAGE }), (x) => x.items)

// ── Expenses and profit ──
export type ExpenseRow = { date: string; treasuryName: string; itemName: string | null; amount: number; notes: string }
export const expenses = (r: Range) =>
  allPages((Page) => get<{ data: ExpenseRow[]; totalCount: number; totalAmount: number }>("ExpensesReport", { FromDate: r.from, ToDate: r.to, Page, PageSize: PAGE }), (x) => x.data)

export type ProfitResult = { totalSales: number; totalCostOfSales: number; grossProfit: number; totalExpenses: number; netProfit: number }
export const profit = (r: Range) => get<ProfitResult>("Profit", { from: r.from, to: r.to })
