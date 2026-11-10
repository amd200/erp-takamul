import { useQuery } from "@tanstack/react-query"
import { tablesApi } from "./service"
import { tableKeys } from "./keys"

/** Every table with its status; refreshed often because the cashier and the waiters share them. */
export const useTables = (enabled = true) => useQuery({ queryKey: tableKeys.list, queryFn: tablesApi.list, enabled, refetchOnWindowFocus: true, refetchInterval: enabled ? 10_000 : false })
/** The tables a new dine-in order can take. */
export const useFreeTables = (enabled = true) => useQuery({ queryKey: tableKeys.free, queryFn: tablesApi.free, enabled, refetchOnWindowFocus: true })
