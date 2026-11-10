import { useQuery } from "@tanstack/react-query"
import { homeApi } from "./service"
import { homeKeys } from "./keys"

// Each figure is asked for only when the user holds its permission (the server answers 403 otherwise).
export const useTodaySales = (enabled: boolean) => useQuery({ queryKey: homeKeys.stat("sales"), queryFn: homeApi.todaySales, enabled })
export const useTodayPurchases = (enabled: boolean) => useQuery({ queryKey: homeKeys.stat("purchases"), queryFn: homeApi.todayPurchases, enabled })
export const useTodayExpenses = (enabled: boolean) => useQuery({ queryKey: homeKeys.stat("expenses"), queryFn: homeApi.todayExpenses, enabled })
export const useTodayProfit = (enabled: boolean) => useQuery({ queryKey: homeKeys.stat("profit"), queryFn: homeApi.todayProfit, enabled })
/** The server answers 404 when it has nothing to count, so a failure just shows zeros. */
export const useInvoiceStatistics = () => useQuery({ queryKey: homeKeys.stat("zatca"), queryFn: homeApi.invoiceStatistics, retry: false })

export const useRecentSales = (orderType: "A4" | "POS" | undefined, enabled: boolean) =>
  useQuery({ queryKey: homeKeys.recent("sales", orderType ?? "all"), queryFn: () => homeApi.sales(orderType), enabled })
export const useRecentPurchases = (enabled: boolean) => useQuery({ queryKey: homeKeys.recent("purchases"), queryFn: homeApi.purchases, enabled })
export const useRecentQuotes = (enabled: boolean) => useQuery({ queryKey: homeKeys.recent("quotes"), queryFn: homeApi.quotes, enabled })
export const useRecentSuppliers = (enabled: boolean) => useQuery({ queryKey: homeKeys.recent("suppliers"), queryFn: homeApi.suppliers, enabled })
export const useRecentCustomers = (enabled: boolean) => useQuery({ queryKey: homeKeys.recent("customers"), queryFn: homeApi.customers, enabled })
