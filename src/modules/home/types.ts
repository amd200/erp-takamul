import type { Purchase } from "@/modules/purchases/types"

/** GET /Statestic/today-* as the server sends them (ERP.BLL/DTOs/Statistics). */
export type TodaySales = { date: string; totalSales: number }
export type TodayPurchases = { date: string; totalPurchases: number }
export type TodayExpenses = { date: string; totalExpenses: number }
export type TodayProfit = { date: string; totalSales: number; totalCostOfSales: number; grossProfit: number; totalExpenses: number; netProfit: number }

/** GET /zatca-invoices/invoice-statistics-today/summary: InvoiceStatisticDto inside { success, message, data }. */
export type InvoiceStatistics = { success?: boolean; message?: string | null; data?: { totalinvoiceValid: number; totalinvoiceRejected: number; totalinvoiceNotSent: number } | null }

/**
 * The current system's purchases tab shows `orderStatus` ("Confirmed" / "UnConfirmed"), but PurchaseOrderDto in the
 * local back-end copy has no such field, so the column stays empty until the server sends it.
 */
export type RecentPurchase = Purchase & { orderStatus?: string | null }
