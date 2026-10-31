import { http } from "@/shared/http/request"
import type { PagedResult } from "@/shared/http/paged"
import type { SalesOrderDto } from "@/modules/sales/types"
import type { Quote } from "@/modules/quotes/types"
import type { Supplier } from "@/modules/suppliers/types"
import type { Customer } from "@/modules/customers/types"
import type { InvoiceStatistics, RecentPurchase, TodayExpenses, TodayProfit, TodayPurchases, TodaySales } from "./types"

/** The five latest rows of each list on the home page, asked for the way the current system asks. */
const latest = <T,>(url: string, params: Record<string, unknown> = {}) =>
  http<PagedResult<T>>(url, { params: { Page: 1, PageSize: 5, ...params } }).then((r) => r.items ?? [])

export const homeApi = {
  todaySales: () => http<TodaySales>("/Statestic/today-sales"),
  todayPurchases: () => http<TodayPurchases>("/Statestic/today-purchases"),
  todayExpenses: () => http<TodayExpenses>("/Statestic/today-expenses"),
  todayProfit: () => http<TodayProfit>("/Statestic/today-profit"),
  invoiceStatistics: () => http<InvoiceStatistics>("/zatca-invoices/invoice-statistics-today/summary"),

  /** `orderType` is left out when the user may see both kinds of invoice. */
  sales: (orderType?: "A4" | "POS") => latest<SalesOrderDto>("/sales-orders", { OrderType: orderType, IsHold: false }),
  purchases: () => latest<RecentPurchase>("/PurchaseOrder"),
  quotes: () => latest<Quote>("/Quotation"),
  suppliers: () => latest<Supplier>("/Suppliers"),
  customers: () => latest<Customer>("/Customer"),
}
