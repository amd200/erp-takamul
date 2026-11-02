import { useQuery } from "@tanstack/react-query"
import { currencyKeys } from "./lists/queries"
import { currenciesApi } from "./lists/service"
import { CURRENCY } from "./constants"

/** Symbol of the default currency (settings › currencies); the fixed fallback until it loads or when it can't be read. */
export function useCurrency(): string {
  const { data } = useQuery({ queryKey: currencyKeys.list(), queryFn: () => currenciesApi.list(), staleTime: 5 * 60_000, retry: false })
  return data?.find((c) => c.isDefault)?.symbol || CURRENCY
}
