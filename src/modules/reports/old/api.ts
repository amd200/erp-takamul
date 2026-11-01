import { http } from "@/shared/http/request"

/** The server's sales report endpoints (GET /reports/products/*), as they answer. */
const BASE = "/reports/products"

export type Sort = { SortBy?: string; SortDescending?: boolean }
export type Branched = { branchid?: number | string | null }

type PagedOf<T> = { items: T[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }
type Pg = { Page?: number; PageSize?: number }

export type SalesInvoiceRow = { invoiceNumber: string; invoiceDate: string; customerName: string; branchName: string; subTotal: number; discountAmount: number; taxAmount: number; grandTotal: number; paidAmount: number; remainingAmount: number; paymentType: string }
export type SalesInvoicesReport = PagedOf<SalesInvoiceRow> & { totals: { totalInvoices: number; totalSubTotal: number; totalDiscount: number; finalTotal: number; totalPaid: number; totalRemaining: number } }
export const salesInvoices = (p: Branched & Pg & { from: string; to: string }) => http<SalesInvoicesReport>(`${BASE}/SalesInvoices`, { params: p })

export type DailySalesRow = { date: string; totalInvoices: number; totalSales: number; totalDiscount: number; totalTax: number; netSales: number; branchid: number | null }
export type DailySalesReport = PagedOf<DailySalesRow> & { totals: { totalInvoices: number; totalSales: number; totalDiscount: number; totalTax: number; netSales: number } }
export const dailySales = (p: Branched & Sort & Pg & { from: string; to: string }) => http<DailySalesReport>(`${BASE}/DailySales`, { params: p })

export type ItemSalesRow = { invoiceNumber: string; invoiceDate: string; quantity: number; unitPrice: number; subTotal: number; discount: number; taxAmount: number; netTotal: number }
export type ItemSalesReport = PagedOf<ItemSalesRow> & { summary: { totalQuantity: number; totalSales: number; totalDiscount: number; totalTax: number; netTotal: number } }
export const itemSales = (p: Branched & Sort & Pg & { productCode: number | string; from: string; to: string }) => http<ItemSalesReport>(`${BASE}/ProductSalesForBrunch`, { params: p })

export type ProductsSalesRow = { productId: number; productCode: number; productName: string; categoryName: string; quantitySold: number; totalSales: number; totalCost: number; profit: number }
export type ProductsSalesReport = PagedOf<ProductsSalesRow> & { totals: { totalQuantity: number; totalSales: number; totalCost: number; totalProfit: number } }
export const productsSales = (p: Branched & Sort & Pg & { from: string; to: string }) => http<ProductsSalesReport>(`${BASE}/ProductsSales`, { params: p })

export type SalesReturnRow = { returnInvoiceNumber: string; originalInvoiceNumber: string; returnDate: string; customerName: string; returnTotal: number; reason: string }
export type SalesReturnsReport = { items: SalesReturnRow[]; totalCount: number; totalReturnAmount: number }
export const salesReturns = (p: Sort & Pg & { BranchId?: number | string | null; From: string; To: string }) => http<SalesReturnsReport>(`${BASE}/SalesReturn`, { params: p })

export type EmployeeSaleRow = { employeeId: number; employeeName: string; branchName: string; invoicesCount: number; totalSales: number; totalReturns: number; netSales: number }
export type EmployeeSalesReport = { items: EmployeeSaleRow[]; summary: { totalInvoices: number; totalSales: number; totalReturns: number; netSales: number }; totalCount?: number }
export const employeeSales = (p: Sort & Pg & { BranchId?: number | string | null; From: string; To: string; EmployeeId?: number | string }) => http<EmployeeSalesReport>(`${BASE}/employee-sales`, { params: p })

export type NetSalesRow = { id: number; type: "Sales" | "SalesReturn"; number: string; date: string; netAmount: number }
export type NetSalesReport = { items: NetSalesRow[]; totalCount: number; page: number; pageSize: number; totalPages: number; salesInvoicesCount?: number; returnInvoicesCount?: number; totalSales: number; totalReturns: number; totalNet: number }
export const netSales = (p: Sort & { BranchId?: number | null; From: string; To: string; Page?: number; PageSize?: number; Type?: "Sales" | "SalesReturn" }) => http<NetSalesReport>(`${BASE}/NetSales`, { params: p })

// ── The rest of the reports, in the shapes of the back end's reports guide (items + paging fields) ──
export type Page = { Page?: number; PageSize?: number }
export type Paged<T> = { items: T[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }

export type DailyPurchaseRow = { date: string; totalInvoices: number; totalPurchases: number; totalDiscount: number; netPurchases: number }
export type DailyPurchasesReport = Paged<DailyPurchaseRow> & { totals: { totalInvoices: number; totalPurchases: number; totalDiscount: number; netPurchases: number } }
export const dailyPurchases = (p: Branched & Sort & Page & { from: string; to: string }) => http<DailyPurchasesReport>(`${BASE}/DailyPurchases`, { params: p })

export type PurchaseInvoiceRow = { invoiceNumber: string; invoiceDate: string; supplierName: string; subTotal: number; discountAmount: number; grandTotal: number; paidAmount: number; remainingAmount: number }
export type PurchaseInvoicesReport = Paged<PurchaseInvoiceRow> & { totals: { totalInvoices: number; totalSubTotal: number; totalDiscount: number; grandTotal: number; paidAmount: number; remainingAmount: number } }
export const purchaseInvoices = (p: Branched & Sort & Page & { from: string; to: string }) => http<PurchaseInvoicesReport>(`${BASE}/PurchaseInvoices`, { params: p })

export type ProductPurchaseRow = { productId: number; productCode: number; productName: string; supplierName: string; quantity: number; unitPrice: number; totalCost: number }
export type ProductPurchasesReport = Paged<ProductPurchaseRow> & { summary: { totalQuantity: number; totalPurchasesCost: number } }
export const productPurchases = (p: Branched & Page & { productID: number | string; from: string; to: string }) => http<ProductPurchasesReport>(`${BASE}/ProductPurchases`, { params: p })

export type StatementRow = { date: string; transactionType: string; docNumber: string; debit: number; credit: number; balance: number; notes: string }
export type Statement = Paged<StatementRow> & { openingBalance: number; totalDebit: number; totalCredit: number; closingBalance: number }
export const customerStatement = (p: Page & { customerId: number | string; from: string; to: string; type?: string }) => http<Statement>(`${BASE}/CustomerStatement`, { params: p })
export const supplierStatement = (p: Page & { supplierId: number | string; from: string; to: string; type?: string }) => http<Statement>(`${BASE}/SupplierStatement`, { params: p })

export type ExpenseRow = { id: number; expenseDate: string; expenseTypeName: string; amount: number; treasuryName: string; notes: string }
export type ExpensesReport = { data: ExpenseRow[]; totalCount: number; totalAmount: number; pageNumber: number; pageSize: number }
export const expensesReport = (p: Branched & Page & { fromDate: string; toDate: string; expenseTypeId?: number | string; treasuryId?: number | string }) => http<ExpensesReport>(`${BASE}/ExpensesReport`, { params: p })

export type ProfitReport = { totalSales: number; totalCost: number; grossProfit: number; totalExpenses: number; netProfit: number; profitMargin: number }
export const profitReport = (p: Branched & { from: string; to: string }) => http<ProfitReport>(`${BASE}/Profit`, { params: p })

/** TopSelling as the server's DTO has it (the guide's names for it did not match what the server sends); it answers a bare empty array when there is nothing. */
export type TopSellingRow = { productId: number; productName: string; barcode: string | null; sellingPrice: number; totalQuantitySold: number; totalSales: number }
export type TopSellingReport = { items: TopSellingRow[]; totalCount: number }
export const topSelling = (p: Branched & { from: string; to: string; count?: number }) => http<TopSellingReport | never[]>(`${BASE}/TopSelling`, { params: p }).then((r) => (Array.isArray(r) ? [] : r.items))

export type MovementRow = { productId: number; productNameAr: string; barcode: string; invoiceNo: string; transDate: string; transType: string; quantityBefore: number; qtyIn: number; qtyOut: number; runningBalance: number }
export type MovementReport = Paged<MovementRow> & { totals: { totalQtyIn: number; totalQtyOut: number; netQty: number; closingBalance: number } }
export const productMovement = (p: Branched & Sort & Page & { productId: number | string; from: string; to: string }) => http<MovementReport>(`${BASE}/movement`, { params: p })

export type StockRow = { productId: number; productCode: number; productName: string; categoryName: string; currentBalance: number; costPrice: number; salePrice: number; totalCost: number; totalSale: number }
export type InventoryStockReport = Paged<StockRow> & { totalQty: number; totalCost: number; totalSale: number }
export const inventoryStock = (p: Branched & Page & { from?: string; to?: string }) => http<InventoryStockReport>(`${BASE}/InventoryStock`, { params: p })

export type StockAlertRow = { productId: number; productCode: number; productName: string; currentQty: number; minStockLevel: number; shortageQty: number }
export type StockAlertsReport = Paged<StockAlertRow> & { totals: { productsCount: number; currentQty: number; minStockLevel: number; shortageQty: number } }
export const stockAlerts = (p: Branched & Sort & Page) => http<StockAlertsReport>(`${BASE}/StockAlerts`, { params: p })

export type PartyInvoice = { invoiceId: number; invoiceNumber: string; date: string; totalAmount: number; paidAmount: number; remainingAmount: number; items: { productName: string; quantity: number; price?: number; unitCost?: number; total?: number; totalCost?: number }[] }
export type PartyInvoicesReport = PagedOf<PartyInvoice>
export const customerSalesDetails = (p: Branched & Pg & { customerId: number | string; from: string; to: string }) => http<PartyInvoicesReport>(`${BASE}/CustomerSalesDetails`, { params: p })
export const supplierPurchaseDetails = (p: Branched & Pg & { supplierId: number | string; from: string; to: string }) => http<PartyInvoicesReport>(`${BASE}/SupplierPurchaseDetails`, { params: p })
