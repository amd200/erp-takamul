import { http } from "@/shared/http/request"

/** The server's sales report endpoints (GET /reports/products/*), as they answer. */
const BASE = "/reports/products"

export type Sort = { SortBy?: string; SortDescending?: boolean }
export type Branched = { branchid?: number | string | null }

export type SalesInvoiceRow = { date: string; orderNumber: string; customerName: string; subTotal: number; discountAmount: number; grandTotal: number; paidAmount: number; remainingAmount: number; paymentStatus: string }
export type SalesInvoicesReport = { data: SalesInvoiceRow[]; totalCount: number; totals: { totalInvoices: number; totalSubTotal: number; totalDiscount: number; finalTotal: number; totalPaid: number; totalRemaining: number } }
export const salesInvoices = (p: Branched & Sort & { From: string; To: string }) => http<SalesInvoicesReport>(`${BASE}/SalesInvoices`, { params: p })

export type DailySalesRow = { date: string; totalInvoices: number; totalSales: number; totalDiscount: number; totalTax: number; netSales: number; branchid: number | null }
export type DailySalesReport = { data: DailySalesRow[]; totalCount: number; totals: { totalInvoices: number; totalSales: number; totalDiscount: number; totalTax: number; netSales: number } }
export const dailySales = (p: Branched & Sort & { From: string; To: string }) => http<DailySalesReport>(`${BASE}/DailySales`, { params: p })

export type ItemSalesRow = { date: string; orderNumber: string; quantitySold: number; totalSales: number; totalPurchases: number }
export type ItemSalesReport = { details: ItemSalesRow[]; summary: { totalOperations: number; totalQuantitySold: number; totalSales: number; totalPurchases: number } }
export const itemSales = (p: Branched & Sort & { productCode: number | string; from: string; to: string }) => http<ItemSalesReport>(`${BASE}/ProductSalesForBrunch`, { params: p })

export type ProductsSalesRow = { productName: string; barcode: string; salesCount: number; totalSales: number }
export type ProductsSalesReport = { details: ProductsSalesRow[]; summary: { grandTotalSales: number } }
export const productsSales = (p: Branched & Sort & { from: string; to: string; page?: number; pageSize?: number; searchTerm?: string }) => http<ProductsSalesReport>(`${BASE}/ProductsSales`, { params: p })

export type SalesReturnRow = { returnId: number; returnNumber: string; salesOrderNumber: string; returnDate: string; customerName: string; returnStatus: string; refundStatus: string; subTotal: number; discountAmount: number; taxAmount: number; grandTotal: number; refundedAmount: number }
export type SalesReturnsReport = { items: SalesReturnRow[]; totalCount: number; pageNumber: number; pageSize: number; totalGrand: number; totalInvoices: number }
export const salesReturns = (p: Sort & { BranchId?: number | string | null; From: string; To: string; Page?: number; PageSize?: number; SearchTerm?: string }) => http<SalesReturnsReport>(`${BASE}/SalesReturn`, { params: p })

export type EmployeeSaleRow = { employeeId: number; employeeName: string; orderNumber: string; orderDate: string; customerName: string; subTotal: number; discountAmount: number; taxAmount: number; grandTotal: number; orderStatus: string; paymentStatus: string }
export type EmployeeSalesReport = { totalSales: number; totalAmount: number; totalInvoices: number; items: EmployeeSaleRow[]; totalCount: number; page: number; pageSize: number; totalPages: number }
export const employeeSales = (p: Sort & { BranchId?: number | string | null; From: string; To: string; Page?: number; PageSize?: number; EmployeeId?: number | string }) => http<EmployeeSalesReport>(`${BASE}/employee-sales`, { params: p })

export type NetSalesRow = { id: number; type: "Sales" | "SalesReturn"; number: string; date: string; grandTotal: number }
export type NetSalesReport = { items: NetSalesRow[]; totalCount: number; page: number; pageSize: number; totalPages: number; salesInvoicesCount: number; returnInvoicesCount: number; totalSales: number; totalReturns: number; netSales: number }
export const netSales = (p: Sort & { BranchId?: number | null; From: string; To: string; Page?: number; PageSize?: number; Type?: "Sales" | "SalesReturn" }) => http<NetSalesReport>(`${BASE}/NetSales`, { params: p })
